import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const owner = await prisma.user.upsert({
    where: { email: "melenciojrl@gmail.com" },
    update: {},
    create: { email: "melenciojrl@gmail.com", name: "Owner" },
  });

  const org = await prisma.organization.upsert({
    where: { slug: "acme" },
    update: {},
    create: {
      name: "Acme Inc",
      slug: "acme",
      sheetId: "1S4DfxQ58zYTunV-wKsugQ1kIKa50drOibBCRAn8zQ_M",
      sheetGidMap: {
        RECEPTIONIST: 0,
        AFTER_HOURS: 541072229,
        REVIEW_MANAGER: 570090134,
        REACTIVATION: 2033373661,
        SPEED_TO_LEAD: 2031365636,
        CART_RECOVERY: 1513216599
      }
    },
  });

  await prisma.orgMembership.upsert({
    where: { userId_orgId: { userId: owner.id, orgId: org.id } },
    update: { role: "OWNER" },
    create: { userId: owner.id, orgId: org.id, role: "OWNER" },
  });

  const mods = ["RECEPTIONIST","AFTER_HOURS","REVIEW_MANAGER","REACTIVATION","SPEED_TO_LEAD","CART_RECOVERY"];
  for (const m of mods) {
    await prisma.orgModuleGrant.upsert({
      where: { orgId_module: { orgId: org.id, module: m } },
      update: { enabled: true },
      create: { orgId: org.id, module: m, enabled: true }
    });
  }

  console.log("Seeded melenciojrl@gmail.com + org acme");
}

main().finally(()=>prisma.$disconnect());
