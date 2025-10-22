"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Upload,
  Headset,
  Clock5,
  MessageSquare,
  MessageCircle,
  ShoppingCart,
  Users2,
  LifeBuoy,
} from "lucide-react";
import OrgSwitcher from "./OrgSwitcher";
import SignOutButton from "@/components/auth/SignOutButton";

type IconProps = React.ComponentProps<typeof LayoutDashboard>;

export default function ClientSidebar({ orgId }: { orgId: string }) {
  const pathname = usePathname();

  const L = (p: string, label: string, Icon: React.ComponentType<IconProps>) => (
    <Link
      className="flex items-center gap-2 rounded px-2 py-1 hover:bg-muted"
      href={`/${orgId}${p}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );

  // Open Services if the current route is inside /services/*
  const [svcOpen, setSvcOpen] = useState<boolean>(false);
  useEffect(() => {
    setSvcOpen(pathname.startsWith(`/${orgId}/services/`));
  }, [pathname, orgId]);

  return (
    <nav className="flex h-full flex-col space-y-2 text-sm">
      <div className="mb-3">
        <div className="text-center text-xl font-semibold">Xilbee AI</div>
        {/* Shows only for OWNER; hidden for clients */}
        <OrgSwitcher />
      </div>

      {L("/onboarding", "Getting Started", ClipboardList)}
      {L("/dashboard", "Dashboard", LayoutDashboard)}
      {L("/uploads", "Uploads", Upload)}

      {/* Collapsible Services */}
      <div className="rounded">
        <button
          type="button"
          aria-expanded={svcOpen}
          aria-controls="services-group"
          onClick={() => setSvcOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded px-2 py-1 text-left hover:bg-muted"
        >
          <span className="inline-flex items-center gap-2 font-medium">
            <Boxes className="h-4 w-4" aria-hidden="true" />
            <span>Services</span>
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${svcOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>

        <div
          id="services-group"
          className={`overflow-hidden transition-[max-height] duration-200 ease-in-out ${
            svcOpen ? "max-h-96" : "max-h-0"
          }`}
        >
          <div className="mt-1 space-y-1 pl-3">
            {L("/services/receptionist", "Receptionist", Headset)}
            {L("/services/after-hours", "After-Hours Sales", Clock5)}
            {L("/services/review-manager", "Review Manager", MessageSquare)}
            {L("/services/reactivation", "Reactivation", MessageCircle)}
            {L("/services/speed-to-lead", "Speed-to-Lead", Clock5)}
            {L("/services/cart-recovery", "Cart Recovery", ShoppingCart)}
          </div>
        </div>
      </div>

      {/* Stick-to-bottom block */}
      <div className="mt-auto border-t pt-3">
        {L("/users", "Users", Users2)}
        {L("/support", "Support", LifeBuoy)}
        <SignOutButton />
      </div>
    </nav>
  );
}
