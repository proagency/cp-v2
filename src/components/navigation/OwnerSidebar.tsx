"use client";

import Link from "next/link";
import OrgSwitcher from "./OrgSwitcher";
import SignOutButton from "@/components/auth/SignOutButton";
import {
  LayoutDashboard,
  Building2,
  Users2,
  Boxes,
  Cable,
} from "lucide-react";

type IconProps = React.ComponentProps<typeof LayoutDashboard>;
const Item = ({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<IconProps>;
}) => (
  <Link
    href={href}
    className="flex items-center gap-2 rounded px-2 py-1 hover:bg-muted"
  >
    <Icon className="h-4 w-4" aria-hidden="true" />
    <span>{label}</span>
  </Link>
);

export default function OwnerSidebar() {
  return (
    <nav className="flex h-full flex-col space-y-2 text-sm">
      <div className="mb-3">
        <div className="text-center text-xl font-semibold">Xilbee AI</div>
        <OrgSwitcher />
      </div>

      <Item href="/dashboard" label="Overview" Icon={LayoutDashboard} />
      <Item href="/organizations" label="Organizations" Icon={Building2} />
      <Item href="/users" label="Users" Icon={Users2} />
      <Item href="/modules" label="Modules" Icon={Boxes} />
      <Item href="/integrations" label="Integrations" Icon={Cable} />

      <div className="mt-auto border-t pt-3">
        <SignOutButton />
      </div>
    </nav>
  );
}
