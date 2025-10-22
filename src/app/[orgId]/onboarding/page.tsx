import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import OnboardingFormClient from "./OnboardingFormClient";

export default async function OnboardingPage({ params }: { params: { orgId: string } }) {
  const s = await getSession();
  if (!s) redirect("/signin");

  const org = await prisma.organization.findUnique({
    where: { id: params.orgId },
    select: { id: true, name: true },
  });

  if (!org) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Getting Started</h1>
        <p className="mt-2 text-sm text-muted-foreground">Organization not found.</p>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Getting Started</h1>
      <OnboardingFormClient orgId={org.id} initialCompanyName={org.name} />
    </main>
  );
}
