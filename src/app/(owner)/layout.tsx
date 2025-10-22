import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import OwnerSidebar from "@/components/navigation/OwnerSidebar";

export default async function OwnerLayout({ children }: { children: ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/signin");

  const isOwner = await prisma.orgMembership.findFirst({
    where: { userId: s.userId, role: "OWNER" },
  });
  if (!isOwner) redirect("/signin");

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar */}
      <aside
        className="hidden w-64 shrink-0 border-r p-3 md:flex md:flex-col md:h-dvh md:overflow-y-auto"
        aria-label="Owner navigation"
      >
        {/* OwnerSidebar has nav: className="flex h-full flex-col ..." so bottom block can use mt-auto */}
        <OwnerSidebar />
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Mobile header (sidebar hidden on mobile) */}
        <div className="block border-b p-3 md:hidden">
          <a href="/(owner)/dashboard" className="text-sm font-medium">
            Owner Console
          </a>
        </div>

        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
