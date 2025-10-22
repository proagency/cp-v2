import { destroySession, getSession } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { audit } from "@/lib/utils/audit";
export async function POST() {
  const s = await getSession();
  await destroySession();
  await audit({ action: "auth.signout", actorId: s?.userId ?? null });
  return new NextResponse(null, { status: 204 });
}
