import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { getSession, getActiveOrgId } from "@/lib/auth/session";
import ClientSidebar from "@/components/navigation/ClientSidebar";

export default async function OrgLayout({ children, params }: { children: ReactNode; params: { orgId: string } }) {
  const s = await getSession();
  if (!s) redirect("/signin");
  const activeOrg = getActiveOrgId(params.orgId, s);
  if (!activeOrg) redirect("/signin");
  const has = await prisma.orgMembership.findFirst({ where: { userId: s.userId, orgId: activeOrg } });
  const ownerImpersonating = s.impersonatedOrgId === activeOrg;
  if (!has && !ownerImpersonating) redirect("/signin");

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-64 shrink-0 border-r p-3 md:block"><ClientSidebar orgId={params.orgId} /></aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
