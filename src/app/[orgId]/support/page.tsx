// src/app/[orgId]/support/page.tsx
import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function SupportPage({ params }: { params: { orgId: string } }) {
  const s = await getSession();
  if (!s) redirect("/signin");

  // Optional: ensure org exists; remove if not needed
  const org = await prisma.organization.findUnique({
    where: { id: params.orgId },
    select: { id: true, name: true },
  });
  if (!org) {
    return (
      <main className="grid min-h-dvh place-items-center p-6">
        <div className="w-full max-w-md rounded border bg-background p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Support</h1>
          <p className="mt-2 text-sm text-destructive">Organization not found.</p>
        </div>
      </main>
    );
  }

  const email = "service@xilbee.com";
  const subject = encodeURIComponent(`Support Request — Org ${org.name} (${org.id})`);
  const href = `mailto:${email}?subject=${subject}`;

  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="w-full max-w-md rounded border bg-background p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold">Support</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Need help? Email us and we’ll get back to you.
        </p>

        <div className="mt-4 rounded border bg-muted/30 p-4">
          <a href={href} className="text-base font-medium underline">
            service@xilbee.com
          </a>
          <p className="mt-1 text-xs text-muted-foreground">
            We’ll include your organization in the subject automatically.
          </p>
        </div>
      </div>
    </main>
  );
}
