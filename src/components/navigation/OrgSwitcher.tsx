"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, ChevronDown } from "lucide-react"; // ⬅️ icons

type Org = { id: string; name: string; slug: string; role?: "OWNER" | "CLIENT_ADMIN" | "CLIENT_USER" };

export default function OrgSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  // Data state
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [impersonatedOrgId, setImpersonatedOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Fetch orgs for the current user (everyone can hit this)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me/orgs", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setLoading(false);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setOrgs(Array.isArray(data.orgs) ? data.orgs : []);
          setIsOwner(Boolean(data.isOwner));
          setImpersonatedOrgId(data.impersonatedOrgId ?? null);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Determine active org from URL: "/:orgId/..."
  const activeOrgIdFromPath = useMemo(() => {
    if (pathname.startsWith("/(owner)/")) return null;
    const m = pathname.match(/^\/([^/()]+)(?:\/|$)/);
    return m ? m[1] : null;
  }, [pathname]);

  // Select value
  const selectValue = useMemo(() => {
    if (isOwner) return activeOrgIdFromPath ?? impersonatedOrgId ?? "";
    return activeOrgIdFromPath ?? "";
  }, [isOwner, activeOrgIdFromPath, impersonatedOrgId]);

  // Options
  const options = useMemo(() => {
    const base = orgs.map(o => ({ value: o.id, label: o.name }));
    return isOwner ? [{ value: "", label: "Main (Owner Console)" }, ...base] : base;
  }, [orgs, isOwner]);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value; // "" means Main (only owners)
    startTransition(async () => {
      try {
        if (isOwner && id === "") {
          const res = await fetch("/api/auth/impersonate", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ stop: true }),
          });
          if (!res.ok) throw new Error("Failed to stop impersonation");
          setImpersonatedOrgId(null);
          router.push("/dashboard");
          return;
        }
        if (isOwner) {
          const res = await fetch("/api/auth/impersonate", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ orgId: id }),
          });
          if (!res.ok) throw new Error("Failed to impersonate");
          setImpersonatedOrgId(id);
        }
        router.push(`/${id}/dashboard`);
      } catch (err: any) {
        toast.error(err?.message ?? "Switcher failed");
      }
    });
  }

  // Render
  if (loading) {
    return <div className="h-8 w-full animate-pulse rounded border bg-muted/50" />;
  }
  if (!isOwner && orgs.length === 0) return null;

  return (
    <label className="block text-xs">
      <div className="relative">
        {/* left icon */}
        <Building2
          className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <select
          value={selectValue ?? ""}
          onChange={onChange}
          disabled={isPending}
          className="w-full appearance-none rounded border bg-background pl-8 pr-8 py-2 text-sm" // pl-8 for left icon, pr-8 for chevron
          aria-label="Organization switcher"
        >
          {options.map(opt => (
            <option key={opt.value || "main"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* right chevron */}
        <ChevronDown
          className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    </label>
  );
}
