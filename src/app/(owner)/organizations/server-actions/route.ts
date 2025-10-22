import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";

export async function GET(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const owner = await prisma.orgMembership.findFirst({ where: { userId: s.userId, role: "OWNER" } });
  if (!owner) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const org = await prisma.organization.findUnique({ where: { id }, select: { id:true, name:true, slug:true, sheetId:true } });
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(org);
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const owner = await prisma.orgMembership.findFirst({ where: { userId: s.userId, role: "OWNER" } });
  if (!owner) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const body = await req.json().catch(()=> ({}));
  const action = String(body.action ?? "");

  try {
    if (action === "create") {
      const { name, slug, sheetId } = body;
      if (!name || !slug) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
      const org = await prisma.organization.create({ data: { name, slug, sheetId } });
      return NextResponse.json({ ok: true, id: org.id });
    }

    if (action === "update") {
      const { id, name, slug, sheetId } = body;
      if (!id || !name || !slug) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
      await prisma.organization.update({ where: { id }, data: { name, slug, sheetId } });
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
      await prisma.organization.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e:any) {
    return NextResponse.json({ error: e.message ?? "Server error" }, { status: 500 });
  }
}
