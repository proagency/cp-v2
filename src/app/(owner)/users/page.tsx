import ConfirmingForm from "@/components/forms/ConfirmingForm";
import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { createUser, addMembership, updateMembership, removeMembership } from "./actions";

export default async function OwnerUsersPage() {
  const s = await getSession();
  if (!s) redirect("/signin");
  const isOwner = await prisma.orgMembership.findFirst({ where: { userId: s.userId, role: "OWNER" } });
  if (!isOwner) redirect("/signin");

  const [users, orgs] = await Promise.all([
    prisma.user.findMany({
      orderBy: { email: "asc" },
      include: { memberships: { include: { org: true } } },
    }),
    prisma.organization.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <main className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Users</h1>

      {/* Create user */}
      <form action={createUser} className="mb-6 grid grid-cols-1 gap-2 rounded border p-3 md:grid-cols-4">
        <input name="email" type="email" placeholder="user@company.com" required className="rounded border px-3 py-2 text-sm md:col-span-2" />
        <input name="name" type="text" placeholder="(optional) name" className="rounded border px-3 py-2 text-sm" />
        <button className="rounded border px-3 py-2 text-sm">Create / Upsert</button>
      </form>

      {/* Add membership */}
      <form action={addMembership} className="mb-6 grid grid-cols-1 gap-2 rounded border p-3 md:grid-cols-5">
        <select name="userId" className="rounded border px-3 py-2 text-sm md:col-span-2" required defaultValue="">
          <option value="" disabled>Select user…</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
        </select>
        <select name="orgId" className="rounded border px-3 py-2 text-sm md:col-span-2" required defaultValue="">
          <option value="" disabled>Select organization…</option>
          {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <select name="role" className="rounded border px-3 py-2 text-sm" defaultValue="CLIENT_USER">
          <option value="OWNER">Owner</option>
          <option value="CLIENT_ADMIN">Client Admin</option>
          <option value="CLIENT_USER">Client User</option>
        </select>
        <button className="rounded border px-3 py-2 text-sm md:col-start-5">Add</button>
      </form>

      {/* Users table */}
      <div className="overflow-auto rounded border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Memberships</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t align-top">
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.name ?? "—"}</td>
                <td className="p-2">
                  <div className="space-y-2">
                    {u.memberships.length === 0 && <div className="text-muted-foreground">—</div>}
                    {u.memberships.map(m => (
                      <div key={m.orgId} className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-muted px-2 py-1 text-xs">{m.org.name}</span>
                        <form action={updateMembership} className="flex items-center gap-2">
                          <input type="hidden" name="userId" value={u.id} />
                          <input type="hidden" name="orgId" value={m.orgId} />
                          <select name="role" defaultValue={m.role} className="rounded border px-2 py-1 text-xs">
                            <option value="OWNER">Owner</option>
                            <option value="CLIENT_ADMIN">Client Admin</option>
                            <option value="CLIENT_USER">Client User</option>
                          </select>
                          <button className="rounded border px-2 py-1 text-xs">Save</button>
                        </form>
                        <ConfirmingForm action={removeMembership} message="Remove this membership?">
                          <input type="hidden" name="userId" value={u.id} />
                          <input type="hidden" name="orgId" value={m.orgId} />
                          <button className="rounded border px-2 py-1 text-xs">Remove</button>
                        </ConfirmingForm>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={3} className="p-3 text-muted-foreground">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
