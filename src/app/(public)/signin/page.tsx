"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function Page() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;

    const normalized = email.trim().toLowerCase();
    if (!isValidEmail(normalized)) {
      toast.error("Enter a valid email.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to send code");
      }
      toast.success("Code sent. Check your email.");
      router.replace(`/verify?email=${encodeURIComponent(normalized)}`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="relative rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 shadow-xl backdrop-blur-sm">
          <div className="p-6 sm:p-7">
            {/* Logo / Brand */}
            <div className="mb-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-900 dark:bg-slate-200 grid place-items-center shadow-sm">
                {/* Placeholder logo */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5 text-white dark:text-slate-900"
                  aria-hidden="true"
                >
                  <path d="M12 3a1 1 0 0 1 .894.553l8 16A1 1 0 0 1 20 21H4a1 1 0 0 1-.894-1.447l8-16A1 1 0 0 1 12 3Zm0 3.236L6.618 19h10.764L12 6.236Z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                  Sign in
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Passwordless login via email code
                </p>
              </div>
            </div>

            <form onSubmit={requestOtp} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-300"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-slate-50/20"
                />
              </div>

              <button
                type="submit"
                disabled={pending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-white dark:focus:ring-slate-50/30"
              >
                {pending ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
                      />
                    </svg>
                    Sending…
                  </>
                ) : (
                  "Send Code"
                )}
              </button>

              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                We’ll email you a 6-digit code. No passwords. By continuing, you
                agree to our{" "}
                <a
                  href="/terms"
                  className="underline underline-offset-2 hover:no-underline"
                >
                  Terms
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  className="underline underline-offset-2 hover:no-underline"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </form>
          </div>
        </div>

        {/* Subtle footer */}
        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
          Having trouble?{" "}
          <a
            href="/help"
            className="font-medium text-slate-700 underline underline-offset-2 hover:no-underline dark:text-slate-200"
          >
            Get help
          </a>
        </p>
      </div>
    </main>
  );
}
