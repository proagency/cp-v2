import { prisma } from "@/lib/prisma/client";

/** Count OWNER memberships in an org. */
export async function countOrgOwners(orgId: string): Promise<number> {
  return prisma.orgMembership.count({
    where: { orgId, role: "OWNER" },
  });
}

/**
 * Throws if removing/demoting the LAST OWNER of an org.
 * Pass the target user's membership; we’ll read current role from DB if needed.
 */
export async function assertNotLastOwnerOnChange(params: {
  orgId: string;
  userId: string;
  /** If provided and is not OWNER, we treat this as a demotion. */
  newRole?: "OWNER" | "CLIENT_ADMIN" | "CLIENT_USER";
  /** When removing membership entirely, set removing=true */
  removing?: boolean;
}) {
  const { orgId, userId, newRole, removing } = params;

  // Only relevant if the current membership is OWNER and we're changing away from OWNER.
  const mem = await prisma.orgMembership.findUnique({
    where: { userId_orgId: { userId, orgId } },
    select: { role: true },
  });
  if (!mem) return; // nothing to guard

  const changingAwayFromOwner =
    mem.role === "OWNER" && (removing || (newRole && newRole !== "OWNER"));
  if (!changingAwayFromOwner) return;

  const owners = await countOrgOwners(orgId);
  if (owners <= 1) {
    throw new Error(
      "Each organization must have at least one Owner. Assign another Owner before removing or demoting the last Owner."
    );
  }
}
