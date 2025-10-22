"use client";

import { useTransition } from "react";
import { toast } from "sonner";

export default function SignOutButton({ className = "" }: { className?: string }) {
  const [isPending, startTransition] = useTransition();

  function signOut() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/signout", { method: "POST" });
        if (!res.ok) throw new Error("Sign out failed");
      } catch (e: any) {
        // Even if the API hiccups, force local redirect to signin
        toast.error(e?.message ?? "Signed out locally");
      } finally {
        window.location.assign("/signin");
      }
    });
  }

  return (
    <button
      onClick={signOut}
      disabled={isPending}
      className={`w-full rounded border px-2 py-1 ${isPending ? "opacity-60" : ""} ${className}`}
    >
      {isPending ? "Signing out…" : "Sign out"}
    </button>
  );
}
