import ConfirmingForm from "@/components/forms/ConfirmingForm";
import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { updateRole, inviteUser, removeMember } from "./server-actions";

type ActorRole = "OWNER" | "CLIENT_ADMIN" | "CLIENT_USER" | null;

export default async function UsersPage({ params }: { params: { orgId: string } }) {
  const s = await getSession();
  if (!s) redirect("/signin");

  const org = await prisma.organization.findUnique({
    where: { id: params.orgId },
    select: { id: true, name: true },
  });
  if (!org) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Organization not found</h1>
      </main>
    );
  }

  const member = await prisma.orgMembership.findFirst({
    where: { orgId: org.id, userId: s.userId },
    select: { role: true },
  });

  const impersonatingThisOrg = s.impersonatedOrgId === org.id;
  const actorRole: ActorRole = impersonatingThisOrg ? "OWNER" : (member?.role ?? null);
  const allowed = actorRole === "OWNER" || actorRole === "CLIENT_ADMIN" || impersonatingThisOrg;

  if (!allowed) {
    return (
      <main className="p-6">
        <h1 className="mb-2 text-xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">
          You don't have permission to manage users in this organization.
        </p>
      </main>
    );
  }

  // Only render NON-OWNER memberships in the table
  const memberships = await prisma.orgMembership.findMany({
    where: { orgId: org.id, NOT: { role: "OWNER" } },
    include: { user: true },
    orderBy: [
      { role: "asc" },
      { user: { email: "asc" } },
    ],
  });

  const isClientAdmin = actorRole === "CLIENT_ADMIN";

  const RoleOptions = ({ includeOwner }: { includeOwner: boolean }) => (
    <>
      {!isClientAdmin && includeOwner ? <option value="OWNER">Owner</option> : null}
      <option value="CLIENT_ADMIN">Client Admin</option>
      <option value="CLIENT_USER">Client User</option>
    </>
  );

  return (
    <main className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Users — {org.name}</h1>

      {/* Invite — CLIENT_ADMIN will not see Owner in the select */}
      <form action={inviteUser} className="mb-6 grid grid-cols-1 gap-2 rounded border p-3 md:grid-cols-4">
        <input type="hidden" name="orgId" value={org.id} />
        <input name="email" type="email" placeholder="user@company.com" required className="rounded border px-3 py-2 text-sm md:col-span-2" />
        <select name="role" defaultValue="CLIENT_USER" className="rounded border px-3 py-2 text-sm">
          <RoleOptions includeOwner={true} />
        </select>
        <button className="rounded border px-3 py-2 text-sm">Invite / Add</button>
      </form>

      {/* Members (OWNER rows hidden) */}
      <div className="overflow-auto rounded border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-2 text-left">User</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {memberships.map((m) => (
              <tr key={m.userId} className="border-t">
                <td className="p-2">{m.user.name ?? "—"}</td>
                <td className="p-2">{m.user.email}</td>
                <td className="p-2">
                  <form action={updateRole} className="flex items-center gap-2">
                    <input type="hidden" name="orgId" value={org.id} />
                    <input type="hidden" name="userId" value={m.userId} />
                    <select name="role" defaultValue={m.role} className="rounded border px-2 py-1 text-xs">
                      <RoleOptions includeOwner={false} />
                    </select>
                    <button className="rounded border px-2 py-1 text-xs">Save</button>
                  </form>
                </td>
                <td className="p-2">
                  <ConfirmingForm action={removeMember} message="Remove user from org?">
                    <input type="hidden" name="orgId" value={org.id} />
                    <input type="hidden" name="userId" value={m.userId} />
                    <button className="rounded border px-2 py-1 text-xs">Remove</button>
                  </ConfirmingForm>
                </td>
              </tr>
            ))}
            {memberships.length === 0 && (
              <tr><td colSpan={4} className="p-3 text-muted-foreground">No users yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
