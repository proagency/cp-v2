"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function Page() {
  const sp = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const e = sp.get("email");
    if (e) setEmail(e);
  }, [sp]);

  async function verify() {
    const res = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error ?? "Invalid or expired code");
    }
    const who = await fetch("/api/auth/whoami").then((r) => r.json()).catch(() => ({}));
    toast.success("Signed in");
    if (who?.isOwner) router.replace("/dashboard");
    else if (who?.firstOrgId) router.replace(`/${who.firstOrgId}/dashboard`);
    else router.replace("/(owner)/dashboard");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await verify();
      } catch (e: any) {
        toast.error(e.message ?? "Failed");
      }
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-lg shadow-slate-200/40 dark:shadow-black/20">
          {/* Header */}
          <div className="px-6 pt-6 pb-2 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
              <span className="text-xl">🔐</span>
            </div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Verify code</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Enter the 6-digit code we sent to
              {" "}
              <span className="font-medium text-slate-900 dark:text-slate-200">{email || "your email"}</span>.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="px-6 pb-6 pt-2 space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                Email
              </label>
              <input
                id="email"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-200 outline-none ring-0 focus:border-slate-300 dark:focus:border-slate-700 focus:ring-4 focus:ring-slate-200/60 dark:focus:ring-slate-800/60 disabled:opacity-60"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                inputMode="email"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="code" className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  6‑Digit Code
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-500">Numbers only</span>
              </div>
              <input
                id="code"
                className="tracking-widest text-center w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-3 text-base tabular-nums text-slate-900 dark:text-slate-100 outline-none focus:border-slate-300 dark:focus:border-slate-700 focus:ring-4 focus:ring-slate-200/60 dark:focus:ring-slate-800/60 disabled:opacity-60"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                required
                autoFocus
                autoComplete="one-time-code"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-500">
                Tip: You can paste the whole code.
              </p>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="relative w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-medium shadow-sm hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              {isPending ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>

            <div className="pt-1 text-center text-xs text-slate-500 dark:text-slate-400">
              Didn’t get the code? <span className="underline underline-offset-2">Resend</span>
            </div>
          </form>
        </div>

        {/* Footer note */}
        <p className="mt-4 text-center text-[11px] text-slate-500 dark:text-slate-400">
          By continuing, you agree to our <span className="underline underline-offset-2">Terms</span> and <span className="underline underline-offset-2">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
