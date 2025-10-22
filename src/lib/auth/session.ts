import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma/client";
import { addDays } from "date-fns";

const COOKIE_NAME = "sid";
const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS ?? 30);

export type SessionInfo = { id: string; userId: string; impersonatedOrgId: string | null; expiresAt: Date; };

export async function getSession(): Promise<SessionInfo | null> {
  const sid = cookies().get(COOKIE_NAME)?.value; if (!sid) return null;
  const s = await prisma.session.findUnique({ where: { id: sid } });
  if (!s || s.expiresAt < new Date()) return null;
  return { id: s.id, userId: s.userId, impersonatedOrgId: s.impersonatedOrgId, expiresAt: s.expiresAt };
}

export async function createSession(userId: string) {
  const id = cryptoRandomHex(16);
  const expiresAt = addDays(new Date(), SESSION_TTL_DAYS);
  await prisma.session.create({ data: { id, userId, expiresAt } });
  setCookie(id, expiresAt); return id;
}
export async function destroySession() {
  const sid = cookies().get(COOKIE_NAME)?.value;
  if (sid) await prisma.session.delete({ where: { id: sid } }).catch(()=>{});
  clearCookie();
}
export function getActiveOrgId(paramOrgId: string | null, session: SessionInfo | null) { return session?.impersonatedOrgId ?? paramOrgId ?? null; }

function setCookie(id: string, expiresAt: Date) {
  cookies().set(COOKIE_NAME, id, { httpOnly: true, sameSite: "lax", secure: true, path: "/", expires: expiresAt });
}
function clearCookie() { cookies().set(COOKIE_NAME, "", { httpOnly: true, sameSite: "lax", secure: true, path: "/", expires: new Date(0) }); }

function cryptoRandomHex(bytes: number) {
  if (typeof window === "undefined") { return require("node:crypto").randomBytes(bytes).toString("hex"); }
  const arr = new Uint8Array(bytes); crypto.getRandomValues(arr);
  return Array.from(arr,(b)=>b.toString(16).padStart(2,"0")).join("");
}
