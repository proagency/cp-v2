import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { OwnerTable } from "@/components/ui/owner-table";
import OrganizationsDrawers from "./_drawers";

export default async function Page() {
  const s = await getSession();
  if (!s) redirect("/signin");
  const owner = await prisma.orgMembership.findFirst({
    where: { userId: s.userId, role: "OWNER" },
  });
  if (!owner) redirect("/signin");

  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, slug: true, sheetId: true, createdAt: true },
  });

  // Pre-format on server
  const rows = orgs.map((o) => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    sheetId: o.sheetId ?? "—",
    createdAtText: o.createdAt.toLocaleString(), // or toISOString()
  }));

  return (
    <main className="p-6">
      <OwnerTable
        title="Organizations"
        rows={rows}
        idKey="id"
        searchKeys={["name", "slug", "sheetId", "createdAtText"]}
        columns={[
          { key: "name", label: "Name" },
          { key: "slug", label: "Slug" },
          { key: "sheetId", label: "Sheet ID" },
          { key: "createdAtText", label: "Created" },
        ]}
        addLabel="Add New"
        eventPrefix="owner.org"
        showActions
      />
      <OrganizationsDrawers />
    </main>
  );
}
