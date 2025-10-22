"use client";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

export function useDrawerState(key = "drawer") {
  const sp = useSearchParams();
  const value = sp.get(key);
  return { open: Boolean(value), value };
}

export function openDrawer(router: ReturnType<typeof useRouter>, name: string, params?: Record<string,string>) {
  const u = new URL(window.location.href);
  u.searchParams.set("drawer", name);
  if (params) for (const [k,v] of Object.entries(params)) u.searchParams.set(k, String(v));
  router.push(u.pathname + "?" + u.searchParams.toString());
}

export function closeDrawer(router: ReturnType<typeof useRouter>) {
  const u = new URL(window.location.href);
  u.searchParams.delete("drawer");
  u.searchParams.delete("id");
  router.push(u.pathname + (u.searchParams.toString() ? "?" + u.searchParams.toString() : ""));
}

export function RightDrawer({
  title, description, children, width = "w-[420px]",
}: { title: string; description?: string; children: React.ReactNode; width?: string }) {
  const router = useRouter();
  const { open } = useDrawerState();
  return (
    <Sheet open={open} onOpenChange={(o)=>{ if(!o) closeDrawer(router); }}>
      <SheetContent side="right" className={width + " p-0"}>
        <div className="border-b p-4">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            {description ? <SheetDescription>{description}</SheetDescription> : null}
          </SheetHeader>
        </div>
        <div className="p-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
