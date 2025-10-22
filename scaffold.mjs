// scaffold.mjs
// Client Portal scaffold — Tailwind v3 (stable), JS configs, native CSV results.
// Node >= 18.18

import { promises as fs } from "node:fs";
import path from "node:path";

const FORCE = process.argv.includes("--force");
const DRY = process.argv.includes("--dry-run");

const R = (...p) => path.join(process.cwd(), ...p);
const log = (...a) => console.log(...a);
const warn = (...a) => console.warn(...a);
const esc = (s) => s.replaceAll("${", "\\${"); // escape template literals inside content

async function ensureDir(d) {
  if (DRY) return log("[dry] mkdir -p", d);
  await fs.mkdir(d, { recursive: true });
}
async function writeFile(rel, content) {
  const file = R(rel);
  await ensureDir(path.dirname(file));
  if (!FORCE) {
    try { await fs.stat(file); warn("exists", rel, "(use --force to overwrite)"); return; }
    catch { /* not exists */ }
  }
  if (DRY) return log("[dry] write", rel);
  await fs.writeFile(file, content, "utf8");
  log("write", rel);
}
async function rmIf(rel) {
  try { await fs.rm(R(rel)); log("remove", rel); } catch {}
}

/* -------------------------------------------------------
 * Root configs (Tailwind v3 + PostCSS JS configs)
 * -----------------------------------------------------*/
const PACKAGE_JSON = esc(`{
  "name": "client-portal",
  "private": true,
  "version": "0.2.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@prisma/client": "^5.18.0",
    "date-fns": "^3.6.0",
    "lucide-react": "^0.469.0",
    "next": "14.2.12",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "sonner": "^1.5.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "autoprefixer": "10.4.20",
    "postcss": "8.4.47",
    "prisma": "^5.18.0",
    "tailwindcss": "3.4.13",
    "typescript": "^5.6.3"
  }
}
`);

const POSTCSS_JS = esc(`// postcss.config.js — Tailwind v3
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`);

const TAILWIND_JS = esc(`// tailwind.config.js — Tailwind v3
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      },
      borderRadius: { lg: "0.5rem", md: "0.375rem", sm: "0.25rem" },
    },
  },
  plugins: [],
};
`);

const NEXT_CONFIG = esc(`/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
};
export default nextConfig;
`);

const TS_CONFIG = esc(`{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["next-env.d.ts", "src", "prisma"],
  "exclude": ["node_modules"]
}
`);

const NEXT_ENV_DTS = esc(`/// <reference types="next" />
/// <reference types="next/image-types/global" />
`);

const ENV_EXAMPLE = esc(`# Auth
AUTH_SECRET=dev-only
SESSION_TTL_DAYS=30
OTP_TTL_MIN=10
WEBHOOK_EMAIL_URL=https://hook.make.com/your-email-relay
# Sheets write via Make (optional)
MAKE_SHEETS_WEBHOOK_URL=https://hook.make.com/append-to-sheet
# DATABASE_URL=postgresql://user:password@host:port/db
`);

/* -------------------------------------------------------
 * Tailwind tokens & base CSS
 * -----------------------------------------------------*/
const GLOBALS_CSS = esc(`@tailwind base;
@tailwind components;
@tailwind utilities;

/* Light tokens */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 233 73% 49%;        /* #2433D6 */
  --primary-foreground: 210 40% 98%;
  --secondary: 212 81% 53%;      /* #2779EC */
  --secondary-foreground: 210 40% 98%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}

/* Optional dark scheme */
:root.dark {
  --background: 224 71% 4%;
  --foreground: 213 31% 91%;
  --muted: 223 47% 11%;
  --muted-foreground: 215.4 16.3% 56.9%;
  --card: 224 71% 4%;
  --card-foreground: 213 31% 91%;
  --primary: 233 73% 49%;
  --primary-foreground: 210 40% 98%;
  --secondary: 212 81% 53%;
  --secondary-foreground: 210 40% 98%;
  --accent: 216 34% 17%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 63% 31%;
  --destructive-foreground: 210 40% 98%;
  --border: 216 34% 17%;
  --input: 216 34% 17%;
  --ring: 222.2 84% 4.9%;
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}
`);

/* -------------------------------------------------------
 * Prisma schema
 * -----------------------------------------------------*/
const PRISMA_SCHEMA = esc(`datasource db { provider = "postgresql"; url = env("DATABASE_URL") }
generator client { provider = "prisma-client-js" }

enum Role { OWNER CLIENT_ADMIN CLIENT_USER }
enum ModuleKey {
  RECEPTIONIST
  AFTER_HOURS
  REVIEW_MANAGER
  REACTIVATION
  SPEED_TO_LEAD
  CART_RECOVERY
}

model User {
  id          String          @id @default(cuid())
  email       String          @unique
  name        String?
  memberships OrgMembership[]
  sessions    Session[]
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

model Organization {
  id           String          @id @default(cuid())
  name         String
  slug         String          @unique
  sheetId      String
  sheetGidMap  Json
  moduleGrants OrgModuleGrant[]
  memberships  OrgMembership[]
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
}

model OrgMembership {
  userId String
  orgId  String
  role   Role
  user   User          @relation(fields: [userId], references: [id])
  org    Organization  @relation(fields: [orgId], references: [id])
  @@id([userId, orgId])
  @@index([orgId])
}

model OrgModuleGrant {
  id      String     @id @default(cuid())
  orgId   String
  module  ModuleKey
  enabled Boolean    @default(true)
  org     Organization @relation(fields: [orgId], references: [id])
  @@unique([orgId, module])
}

model Session {
  id                String   @id
  userId            String
  impersonatedOrgId String?
  expiresAt         DateTime
  user              User     @relation(fields: [userId], references: [id])
}

model VerificationToken {
  id         String   @id @default(cuid())
  identifier String
  codeHash   String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
}

model AuditLog {
  id         String   @id @default(cuid())
  orgId      String?
  actorId    String?
  action     String
  targetType String?
  targetId   String?
  ip         String?
  uaHash     String?
  metadata   Json?
  createdAt  DateTime @default(now())
}
`);

const PRISMA_SEED = esc(`import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const owner = await prisma.user.upsert({
    where: { email: "owner@example.com" },
    update: {},
    create: { email: "owner@example.com", name: "Owner" },
  });

  const org = await prisma.organization.upsert({
    where: { slug: "acme" },
    update: {},
    create: {
      name: "Acme Inc",
      slug: "acme",
      sheetId: "REPLACE_WITH_SHEET_ID",
      sheetGidMap: {
        RECEPTIONIST: 0,
        AFTER_HOURS: 111111111,
        REVIEW_MANAGER: 222222222,
        REACTIVATION: 333333333,
        SPEED_TO_LEAD: 444444444,
        CART_RECOVERY: 555555555
      }
    },
  });

  await prisma.orgMembership.upsert({
    where: { userId_orgId: { userId: owner.id, orgId: org.id } },
    update: { role: "OWNER" },
    create: { userId: owner.id, orgId: org.id, role: "OWNER" },
  });

  const mods = ["RECEPTIONIST","AFTER_HOURS","REVIEW_MANAGER","REACTIVATION","SPEED_TO_LEAD","CART_RECOVERY"];
  for (const m of mods) {
    await prisma.orgModuleGrant.upsert({
      where: { orgId_module: { orgId: org.id, module: m } },
      update: { enabled: true },
      create: { orgId: org.id, module: m, enabled: true }
    });
  }

  console.log("Seeded owner@example.com + org acme");
}

main().finally(()=>prisma.$disconnect());
`);

/* -------------------------------------------------------
 * App + Public (landing, signin, verify)
 * -----------------------------------------------------*/
const APP_LAYOUT = esc(`import "@/styles/globals.css";
import { Toaster } from "sonner";

export const metadata = { title: "Client Portal", description: "Sheet-powered client portal" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
`);

const APP_HOME = esc(`export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl p-8 space-y-4">
      <h1 className="text-2xl font-semibold">Tailwind Smoke Test</h1>
      <p className="text-sm text-muted-foreground">If this is gray and blocks below are styled, Tailwind v3 is live.</p>
      <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">Muted block</div>
      <button className="rounded-md bg-primary px-3 py-2 text-primary-foreground">Primary Button</button>
      <div className="rounded-md border p-3">Bordered card</div>
      <div className="pt-4">
        <a href="/signin" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Sign in</a>
      </div>
    </main>
  );
}
`);

const PUBLIC_LAYOUT = esc(`export default function PublicLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }`);

const SIGNIN_PAGE = esc(`"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

function isValidEmail(v: string) { return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v); }

export default function Page() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    const normalized = email.trim().toLowerCase();
    if (!isValidEmail(normalized)) { toast.error("Enter a valid email."); return; }
    setPending(true);
    try {
      const res = await fetch("/api/auth/otp/request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: normalized }) });
      if (!res.ok) { const j = await res.json().catch(()=>({})); throw new Error(j.error ?? "Failed to send code"); }
      toast.success("Code sent. Check your email.");
      router.replace(\`/verify?email=\${encodeURIComponent(normalized)}\`);
    } catch (e:any) { toast.error(e.message ?? "Failed"); }
    finally { setPending(false); }
  }

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-xl font-semibold">Sign in</h1>
      <form onSubmit={requestOtp} className="space-y-4">
        <div>
          <label className="block text-xs">Email</label>
          <input className="w-full rounded border px-3 py-2 text-sm" type="email" placeholder="you@company.com" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        </div>
        <button disabled={pending} className="w-full rounded border px-3 py-2 text-sm">{pending?"…":"Send Code"}</button>
        <p className="text-xs text-muted-foreground">We’ll email you a 6-digit code. No passwords.</p>
      </form>
    </div>
  );
}
`);

const VERIFY_PAGE = esc(`"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function Page() {
  const sp = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(()=>{ const e = sp.get("email"); if (e) setEmail(e); },[sp]);

  async function verify() {
    const res = await fetch("/api/auth/otp/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, code }) });
    if (!res.ok) { const j = await res.json().catch(()=>({})); throw new Error(j.error ?? "Invalid or expired code"); }
    const who = await fetch("/api/auth/whoami").then(r=>r.json()).catch(()=>({}));
    toast.success("Signed in");
    if (who?.isOwner) router.replace("/(owner)/dashboard");
    else if (who?.firstOrgId) router.replace(\`/\${who.firstOrgId}/dashboard\`);
    else router.replace("/(owner)/dashboard");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => { try { await verify(); } catch (e:any) { toast.error(e.message ?? "Failed"); } });
  }

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-xl font-semibold">Verify code</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs">Email</label>
          <input className="w-full rounded border px-3 py-2 text-sm" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs">6-Digit Code</label>
          <input className="w-full rounded border px-3 py-2 text-sm" inputMode="numeric" pattern="[0-9]*" maxLength={6} placeholder="123456" value={code} onChange={(e)=>setCode(e.target.value)} required />
        </div>
        <button disabled={isPending} className="w-full rounded border px-3 py-2 text-sm">{isPending?"…":"Sign in"}</button>
      </form>
    </div>
  );
}
`);

/* -------------------------------------------------------
 * OWNER routes
 * -----------------------------------------------------*/
const OWNER_LAYOUT = esc(`import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import OwnerSidebar from "@/components/navigation/OwnerSidebar";

export default async function OwnerLayout({ children }: { children: ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/signin");
  const isOwner = await prisma.orgMembership.findFirst({ where: { userId: s.userId, role: "OWNER" } });
  if (!isOwner) redirect("/signin");
  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-64 shrink-0 border-r p-3 md:block"><OwnerSidebar /></aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
`);

const OWNER_DASH = esc(`export default function OwnerDashboard() {
  return (
    <main className="p-6">
      <h1 className="mb-2 text-xl font-semibold">Owner Dashboard</h1>
      <p className="text-sm text-muted-foreground">Manage organizations, modules, and integrations.</p>
    </main>
  );
}
`);

const OWNER_ORGS_PAGE = esc(`import { prisma } from "@/lib/prisma/client";
import { createOrg, renameOrg } from "./actions";

export default async function OrgsPage() {
  const orgs = await prisma.organization.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <main className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Organizations</h1>
      <form action={createOrg} className="mb-6 flex gap-2">
        <input name="name" placeholder="Org name" className="w-64 rounded border px-3 py-2 text-sm" required />
        <input name="slug" placeholder="slug" className="w-48 rounded border px-3 py-2 text-sm" required />
        <button className="rounded border px-3 py-2 text-sm">Create</button>
      </form>
      <ul className="space-y-2">
        {orgs.map(o => (
          <li key={o.id} className="flex items-center gap-2">
            <span className="font-medium">{o.name}</span>
            <span className="text-xs text-muted-foreground">/ {o.slug}</span>
            <form action={renameOrg} className="ml-4 flex gap-2">
              <input type="hidden" name="orgId" value={o.id} />
              <input name="name" placeholder="Rename" className="rounded border px-2 py-1 text-xs" />
              <button className="rounded border px-2 py-1 text-xs">Save</button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
`);

const OWNER_ORGS_ACTIONS = esc(`"use server";
import { prisma } from "@/lib/prisma/client";
import { audit } from "@/lib/utils/audit";
import { revalidatePath } from "next/cache";

export async function createOrg(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  if (!name || !slug) throw new Error("Missing fields");
  const sheetId = "REPLACE_SHEET_ID";
  const map = { RECEPTIONIST:0, AFTER_HOURS:111111111, REVIEW_MANAGER:222222222, REACTIVATION:333333333, SPEED_TO_LEAD:444444444, CART_RECOVERY:555555555 };
  const org = await prisma.organization.create({ data: { name, slug, sheetId, sheetGidMap: map } });
  await audit({ action: "owner.org.create", targetId: org.id });
  revalidatePath("/(owner)/organizations");
}

export async function renameOrg(formData: FormData) {
  const id = String(formData.get("orgId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) throw new Error("Missing fields");
  await prisma.organization.update({ where: { id }, data: { name } });
  await audit({ action: "owner.org.rename", targetId: id, metadata: { name } });
  revalidatePath("/(owner)/organizations");
}
`);

const OWNER_MODULES_PAGE = esc(`import { prisma } from "@/lib/prisma/client";
import { toggleModule } from "./actions";
import { ModuleKey } from "@prisma/client";
const MODULES: ModuleKey[] = ["RECEPTIONIST","AFTER_HOURS","REVIEW_MANAGER","REACTIVATION","SPEED_TO_LEAD","CART_RECOVERY"];

export default async function ModulesPage() {
  const orgs = await prisma.organization.findMany({ include: { moduleGrants: true }, orderBy: { name: "asc" } });
  return (
    <main className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Modules (Grants)</h1>
      <div className="overflow-auto rounded border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr><th className="p-2 text-left">Organization</th>{MODULES.map(m => <th key={m} className="p-2 text-left">{m}</th>)}</tr>
          </thead>
          <tbody>
            {orgs.map(o => {
              const gm = Object.fromEntries(o.moduleGrants.map(g=>[g.module,g.enabled]));
              const map = o.sheetGidMap as Record<string,number>;
              return (
                <tr key={o.id} className="border-t">
                  <td className="p-2 font-medium">{o.name}</td>
                  {MODULES.map(m => (
                    <td key={m} className="p-2">
                      <form action={toggleModule} className="flex items-center gap-2">
                        <input type="hidden" name="orgId" value={o.id} />
                        <input type="hidden" name="module" value={m} />
                        <input type="hidden" name="enabled" value={(!gm[m]) ? "true" : "false"} />
                        <button className="rounded border px-2 py-1 text-xs">{gm[m] ? "Disable" : "Enable"}</button>
                        <span className="text-[11px] text-muted-foreground">GID {typeof map?.[m]==="number" ? map[m] : "⚠︎"}</span>
                      </form>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
`);

const OWNER_MODULES_ACTIONS = esc(`"use server";
import { prisma } from "@/lib/prisma/client";
import { audit } from "@/lib/utils/audit";
import { revalidatePath } from "next/cache";
import { ModuleKey } from "@prisma/client";

export async function toggleModule(formData: FormData) {
  const orgId = String(formData.get("orgId") ?? "");
  const module = String(formData.get("module") ?? "") as ModuleKey;
  const enabled = String(formData.get("enabled") ?? "true") === "true";
  if (!orgId || !module) throw new Error("Missing fields");
  await prisma.orgModuleGrant.upsert({
    where: { orgId_module: { orgId, module } },
    update: { enabled },
    create: { orgId, module, enabled },
  });
  await audit({ action: "owner.module.toggle", orgId, metadata: { module, enabled } });
  revalidatePath("/(owner)/modules");
}
`);

const OWNER_INTEGRATIONS_PAGE = esc(`import { prisma } from "@/lib/prisma/client";
import { saveSheetConfig } from "./actions";

export default async function IntegrationsPage() {
  const orgs = await prisma.organization.findMany({ orderBy: { name: "asc" } });
  return (
    <main className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Integrations (Google Sheets)</h1>
      <div className="space-y-6">
        {orgs.map(o => (
          <form key={o.id} action={saveSheetConfig} className="rounded border p-4">
            <input type="hidden" name="orgId" value={o.id} />
            <div className="mb-2 text-sm font-medium">{o.name}</div>
            <div className="mb-2">
              <label className="block text-xs">Sheet ID</label>
              <input name="sheetId" defaultValue={o.sheetId} className="w-full rounded border px-3 py-2 text-sm" required />
            </div>
            <div className="mb-2">
              <label className="block text-xs">GID Map (JSON with all 6 keys)</label>
              <textarea name="sheetGidMap" defaultValue={JSON.stringify(o.sheetGidMap ?? {}, null, 2)} rows={6} className="w-full rounded border px-3 py-2 text-xs font-mono" required />
            </div>
            <button className="rounded border px-3 py-2 text-sm">Save</button>
          </form>
        ))}
      </div>
    </main>
  );
}
`);

const OWNER_INTEGRATIONS_ACTIONS = esc(`"use server";
import { prisma } from "@/lib/prisma/client";
import { audit } from "@/lib/utils/audit";
import { revalidatePath } from "next/cache";
import { SaveSheetConfigInput, SheetGidMapSchema } from "@/lib/validation/integrations";

export async function saveSheetConfig(formData: FormData) {
  const input = {
    orgId: String(formData.get("orgId") ?? ""),
    sheetId: String(formData.get("sheetId") ?? ""),
    sheetGidMap: parseJson(String(formData.get("sheetGidMap") ?? "{}")),
  };
  const parsed = SaveSheetConfigInput.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues.map(i=>i.message).join(", "));
  const mapParsed = SheetGidMapSchema.safeParse(parsed.data.sheetGidMap);
  if (!mapParsed.success) throw new Error("GID map must include all 6 modules with numeric gids.");
  await prisma.organization.update({ where: { id: parsed.data.orgId }, data: { sheetId: parsed.data.sheetId, sheetGidMap: parsed.data.sheetGidMap } });
  await audit({ action: "owner.sheet.config.save", orgId: parsed.data.orgId });
  revalidatePath("/(owner)/integrations");
}
function parseJson(s) { try { return JSON.parse(s); } catch { return {}; } }
`);

/* -------------------------------------------------------
 * ORG routes + services (native CSV)
 * -----------------------------------------------------*/
const ORG_LAYOUT = esc(`import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { getSession, getActiveOrgId } from "@/lib/auth/session";
import ClientSidebar from "@/components/navigation/ClientSidebar";

export default async function OrgLayout({ children, params }: { children: ReactNode; params: { orgId: string } }) {
  const s = await getSession();
  if (!s) redirect("/signin");
  const activeOrg = getActiveOrgId(params.orgId, s);
  if (!activeOrg) redirect("/signin");
  const has = await prisma.orgMembership.findFirst({ where: { userId: s.userId, orgId: activeOrg } });
  const ownerImpersonating = s.impersonatedOrgId === activeOrg;
  if (!has && !ownerImpersonating) redirect("/signin");

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-64 shrink-0 border-r p-3 md:block"><ClientSidebar orgId={params.orgId} /></aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
`);

const ORG_DASH = esc(`export default function OrgDashboard() {
  return (
    <main className="p-6">
      <h1 className="mb-2 text-xl font-semibold">Dashboard</h1>
      <p className="text-sm text-muted-foreground">Choose a module to view native results (CSV parsed from your Google Sheet).</p>
    </main>
  );
}
`);

const ORG_ONBOARDING = esc(`export default function OnboardingPage() {
  return (
    <main className="p-6">
      <h1 className="mb-2 text-xl font-semibold">Onboarding</h1>
      <p className="text-sm text-muted-foreground">Simple form goes here. Wire to Make.com later if needed.</p>
    </main>
  );
}
`);

const ORG_UPLOADS = esc(`export default function UploadsPage() {
  return (
    <main className="p-6">
      <h1 className="mb-2 text-xl font-semibold">Uploads</h1>
      <p className="text-sm text-muted-foreground">Generic uploads entry (external webhook). No in-app storage.</p>
    </main>
  );
}
`);

function servicePage(moduleKey) {
  return esc(`import { prisma } from "@/lib/prisma/client";
import { fetchPublishedCsv } from "@/server/sheets/published";
import ResultsTable from "@/components/results/ResultsTable";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { orgId: string } }) {
  const org = await prisma.organization.findUnique({ where: { id: params.orgId } });
  if (!org?.sheetId) return <main className="p-6"><h1 className="text-xl font-semibold">Not configured</h1></main>;

  const map = org.sheetGidMap as Record<string, number>;
  const gid = map?.["${moduleKey}"];
  if (typeof gid !== "number") return <main className="p-6"><h1 className="text-xl font-semibold">Tab not configured</h1></main>;

  const rows = await fetchPublishedCsv({ sheetId: org.sheetId, gid, revalidateSec: 60 });

  return (
    <main className="p-4">
      <h1 className="mb-3 text-lg font-semibold">${moduleKey.replace("_"," ")} Results</h1>
      <ResultsTable rows={rows} />
    </main>
  );
}
`);
}

/* -------------------------------------------------------
 * API (auth only)
 * -----------------------------------------------------*/
const API_OTP_REQUEST = esc(`import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { sha256, randomSixDigit } from "@/lib/auth/crypto";
import { audit } from "@/lib/utils/audit";

const OTP_TTL_MIN = Number(process.env.OTP_TTL_MIN ?? 10);

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}));
  if (!email || typeof email !== "string") return NextResponse.json({ error: "Email required" }, { status: 400 });

  const code = randomSixDigit();
  const codeHash = sha256(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60_000);

  await prisma.verificationToken.create({ data: { identifier: email.toLowerCase(), codeHash, expiresAt } });

  const webhook = process.env.WEBHOOK_EMAIL_URL;
  if (webhook) {
    await fetch(webhook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "otp", email, code }) }).catch(()=>{});
  }

  await audit({ action: "auth.otp.request", metadata: { email } });
  return NextResponse.json({ ok: true });
}
`);

const API_OTP_VERIFY = esc(`import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { sha256 } from "@/lib/auth/crypto";
import { createSession } from "@/lib/auth/session";
import { audit } from "@/lib/utils/audit";

export async function POST(req: Request) {
  const { email, code } = await req.json().catch(() => ({}));
  if (!email || !code) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const token = await prisma.verificationToken.findFirst({ where: { identifier: email.toLowerCase() }, orderBy: { createdAt: "desc" } });
  const now = new Date();
  if (!token || token.expiresAt < now || token.codeHash !== sha256(code)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }
  await prisma.verificationToken.delete({ where: { id: token.id } }).catch(()=>{});

  const user = await prisma.user.upsert({ where: { email: email.toLowerCase() }, update: {}, create: { email: email.toLowerCase(), name: email.split("@")[0] } });
  await createSession(user.id);
  await audit({ action: "auth.otp.verify", actorId: user.id });
  return NextResponse.json({ ok: true });
}
`);

const API_SIGNOUT = esc(`import { destroySession, getSession } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import { audit } from "@/lib/utils/audit";
export async function POST() {
  const s = await getSession();
  await destroySession();
  await audit({ action: "auth.signout", actorId: s?.userId ?? null });
  return new NextResponse(null, { status: 204 });
}
`);

const API_WHOAMI = esc(`import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma/client";
export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ signedIn: false });
  const memberships = await prisma.orgMembership.findMany({ where: { userId: s.userId } });
  const isOwner = memberships.some((m) => m.role === "OWNER");
  const firstOrgId = memberships[0]?.orgId ?? null;
  return NextResponse.json({ signedIn: true, isOwner, firstOrgId, impersonatedOrgId: s.impersonatedOrgId });
}
`);

const API_IMPERSONATE = esc(`import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getSession } from "@/lib/auth/session";
import { audit } from "@/lib/utils/audit";

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const owner = await prisma.orgMembership.findFirst({ where: { userId: s.userId, role: "OWNER" } });
  if (!owner) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const { orgId, stop } = await req.json().catch(() => ({}));
  if (stop) {
    await prisma.session.update({ where: { id: s.id }, data: { impersonatedOrgId: null } });
    await audit({ action: "owner.impersonate.stop", actorId: s.userId });
    return NextResponse.json({ ok: true });
  }
  if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });
  const ex = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!ex) return NextResponse.json({ error: "Org not found" }, { status: 404 });
  await prisma.session.update({ where: { id: s.id }, data: { impersonatedOrgId: orgId } });
  await audit({ action: "owner.impersonate.start", actorId: s.userId, orgId });
  return NextResponse.json({ ok: true });
}
`);

/* -------------------------------------------------------
 * lib, server, components (minimal)
 * -----------------------------------------------------*/
const PRISMA_CLIENT = esc(`import { PrismaClient } from "@prisma/client";
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
`);

const CRYPTO = esc(`import { createHash, randomBytes } from "node:crypto";
export function sha256(input: string) { return createHash("sha256").update(input).digest("hex"); }
export function randomSixDigit(): string { const n = randomBytes(3).readUIntBE(0,3) % 1_000_000; return n.toString().padStart(6,"0"); }
`);

const SESSION = esc(`import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma/client";
import { addDays } from "date-fns";

const COOKIE_NAME = "sid";
const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS ?? 30);

export type SessionInfo = { id: string; userId: string; impersonatedOrgId: string | null; expiresAt: Date; };

export async function getSession(): Promise<SessionInfo | null> {
  const sid = cookies().get(COOKIE_NAME)?.value; if (!sid) return null;
  const s = await prisma.session.findUnique({ where: { id: sid } });
  if (!s || s.expiresAt < new Date()) return null;
  return { id: s.id, userId: s.userId, impersonatedOrgId: s.impersonatedOrgId, expiresAt: s.expiresAt };
}

export async function createSession(userId: string) {
  const id = cryptoRandomHex(16);
  const expiresAt = addDays(new Date(), SESSION_TTL_DAYS);
  await prisma.session.create({ data: { id, userId, expiresAt } });
  setCookie(id, expiresAt); return id;
}
export async function destroySession() {
  const sid = cookies().get(COOKIE_NAME)?.value;
  if (sid) await prisma.session.delete({ where: { id: sid } }).catch(()=>{});
  clearCookie();
}
export function getActiveOrgId(paramOrgId: string | null, session: SessionInfo | null) { return session?.impersonatedOrgId ?? paramOrgId ?? null; }

function setCookie(id: string, expiresAt: Date) {
  cookies().set(COOKIE_NAME, id, { httpOnly: true, sameSite: "lax", secure: true, path: "/", expires: expiresAt });
}
function clearCookie() { cookies().set(COOKIE_NAME, "", { httpOnly: true, sameSite: "lax", secure: true, path: "/", expires: new Date(0) }); }

function cryptoRandomHex(bytes: number) {
  if (typeof window === "undefined") { return require("node:crypto").randomBytes(bytes).toString("hex"); }
  const arr = new Uint8Array(bytes); crypto.getRandomValues(arr);
  return Array.from(arr,(b)=>b.toString(16).padStart(2,"0")).join("");
}
`);

const AUDIT = esc(`import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/client";
import { createHash } from "node:crypto";

export async function audit({ orgId, actorId, action, targetType, targetId, metadata }:{
  orgId?: string | null; actorId?: string | null; action: string; targetType?: string | null; targetId?: string | null; metadata?: unknown;
}) {
  const h = headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  const ua = h.get("user-agent") || ""; const uaHash = createHash("sha256").update(ua).digest("hex");
  await prisma.auditLog.create({ data: { orgId: orgId ?? null, actorId: actorId ?? null, action, targetType: targetType ?? null, targetId: targetId ?? null, ip: ip ?? undefined, uaHash, metadata: metadata as any } });
}
`);

const VALIDATION_INTEGRATIONS = esc(`import { z } from "zod";
export const sheetIdPattern = /^[a-zA-Z0-9-_]{20,}$/;
export const SheetGidMapSchema = z.object({
  RECEPTIONIST: z.number().int().nonnegative(),
  AFTER_HOURS: z.number().int().nonnegative(),
  REVIEW_MANAGER: z.number().int().nonnegative(),
  REACTIVATION: z.number().int().nonnegative(),
  SPEED_TO_LEAD: z.number().int().nonnegative(),
  CART_RECOVERY: z.number().int().nonnegative(),
});
export const SaveSheetConfigInput = z.object({
  orgId: z.string().min(1),
  sheetId: z.string().regex(sheetIdPattern, "Invalid Sheet ID"),
  sheetGidMap: SheetGidMapSchema,
});
`);

const SHEETS_PUBLISHED = esc(`export async function fetchPublishedCsv(opts: { sheetId: string; gid: string | number; revalidateSec?: number }) {
  const { sheetId, gid, revalidateSec = 60 } = opts;
  const url = new URL(\`https://docs.google.com/spreadsheets/d/\${sheetId}/export\`);
  url.searchParams.set("format", "csv");
  url.searchParams.set("gid", String(gid));
  const res = await fetch(url.toString(), { next: { revalidate: revalidateSec } });
  if (!res.ok) throw new Error(\`Sheet fetch failed: \${res.status}\`);
  const csv = await res.text();
  return parseCsv(csv);
}
function parseCsv(text) {
  const rows = []; let row = []; let cell = ""; let inQuotes = false;
  for (let i=0;i<text.length;i++) {
    const ch = text[i]; const next = text[i+1];
    if (inQuotes) {
      if (ch === '"' && next === '"') { cell += '"'; i++; continue; }
      if (ch === '"') { inQuotes = false; continue; }
      cell += ch; continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === ",") { row.push(cell); cell=""; continue; }
    if (ch === "\\n") { row.push(cell); rows.push(row); row=[]; cell=""; continue; }
    if (ch === "\\r") { continue; }
    cell += ch;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
`);

const RESULTS_TABLE = esc(`"use client";
import { useMemo, useState } from "react";

type Props = { rows: string[][] };
function parseDateSafe(s: string) { const d = new Date(s); return isNaN(+d) ? null : d; }

export default function ResultsTable({ rows }: Props) {
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<"all"|"today"|"7d"|"30d">("all");

  const [header, body] = useMemo(()=>{
    const h = rows[0] ?? [];
    const w = h.length;
    const b = rows.slice(1).map(r => (r.length>=w ? r.slice(0,w) : [...r, ...Array(w-r.length).fill("")]));
    return [h, b] as const;
  }, [rows]);

  const filtered = useMemo(()=>{
    const now = new Date();
    const since = range==="today" ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
      : range==="7d" ? new Date(now.getTime() - 7*864e5)
      : range==="30d" ? new Date(now.getTime() - 30*864e5)
      : null;
    const q = query.trim().toLowerCase();
    return body.filter(r => {
      if (since) {
        const d = parseDateSafe(r[0] ?? ""); // first col = timestamp
        if (!d || d < since) return false;
      }
      if (!q) return true;
      return r.some(c => (c ?? "").toString().toLowerCase().includes(q));
    });
  }, [body, query, range]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input className="w-64 rounded border px-3 py-2 text-sm" placeholder="Search…" value={query} onChange={(e)=>setQuery(e.target.value)} />
        <div className="ml-auto flex gap-1">
          {(["all","today","7d","30d"] as const).map(v =>
            <button key={v} onClick={()=>setRange(v)} className={\`rounded border px-2 py-1 text-xs \${range===v?"bg-primary text-white border-primary":""}\`}>{v}</button>
          )}
        </div>
      </div>
      <div className="overflow-auto rounded border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>{header.map((h,i)=><th key={i} className="p-2 text-left">{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map((r,ri) => (
              <tr key={ri} className="border-t odd:bg-muted/30">
                {r.map((c,ci)=><td key={ci} className="p-2">{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-muted-foreground">{filtered.length} rows</div>
    </div>
  );
}
`);

const OWNER_SIDEBAR = esc(`"use client";
import OrgSwitcher from "./OrgSwitcher";
export default function OwnerSidebar() {
  return (
    <nav className="space-y-2 text-sm">
      <div className="mb-3">
        <div className="font-semibold">Client Portal</div>
        <OrgSwitcher />
      </div>
      <a className="block rounded px-2 py-1 hover:bg-muted" href="/(owner)/dashboard">Overview</a>
      <a className="block rounded px-2 py-1 hover:bg-muted" href="/(owner)/organizations">Organizations</a>
      <a className="block rounded px-2 py-1 hover:bg-muted" href="/(owner)/modules">Modules (Grants)</a>
      <a className="block rounded px-2 py-1 hover:bg-muted" href="/(owner)/integrations">Integrations (Sheets)</a>
      <div className="mt-6 border-t pt-3">
        <form action="/api/auth/signout" method="post"><button className="w-full rounded border px-2 py-1">Sign out</button></form>
      </div>
    </nav>
  );
}
`);

const CLIENT_SIDEBAR = esc(`"use client";
export default function ClientSidebar({ orgId }: { orgId: string }) {
  const L = (p:string, label:string) => <a className="block rounded px-2 py-1 hover:bg-muted" href={\`/\${orgId}\${p}\`}>{label}</a>;
  return (
    <nav className="space-y-2 text-sm">
      <div className="mb-3 font-semibold">Client Portal</div>
      {L("/dashboard","Dashboard")}
      {L("/onboarding","Onboarding")}
      {L("/uploads","Uploads")}
      {L("/services/receptionist","Receptionist")}
      {L("/services/after-hours","After-Hours Sales")}
      {L("/services/review-manager","Review Manager")}
      {L("/services/reactivation","Reactivation")}
      {L("/services/speed-to-lead","Speed-to-Lead")}
      {L("/services/cart-recovery","Cart Recovery")}
      {L("/support","Support")}
      <div className="mt-6 border-t pt-3">
        <form action="/api/auth/signout" method="post"><button className="w-full rounded border px-2 py-1">Sign out</button></form>
      </div>
    </nav>
  );
}
`);

const ORG_SWITCHER = esc(`"use client";
import { toast } from "sonner";
export default function OrgSwitcher() {
  async function goMain() {
    try { await fetch("/api/auth/impersonate", { method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify({ stop: true }) }); location.href="/(owner)/dashboard"; }
    catch { toast.error("Switcher failed"); }
  }
  return (
    <div className="space-y-2">
      <button onClick={goMain} className="w-full rounded border px-2 py-1 text-left text-sm">Main</button>
      {/* Replace with real org list button(s) wired to /api/auth/impersonate { orgId } */}
    </div>
  );
}
`);

/* -------------------------------------------------------
 * write all
 * -----------------------------------------------------*/
const files = new Map([
  // root
  ["package.json", PACKAGE_JSON],
  ["postcss.config.js", POSTCSS_JS],
  ["tailwind.config.js", TAILWIND_JS],
  ["next.config.mjs", NEXT_CONFIG],
  ["tsconfig.json", TS_CONFIG],
  ["next-env.d.ts", NEXT_ENV_DTS],
  [".env.example", ENV_EXAMPLE],

  // prisma
  ["prisma/schema.prisma", PRISMA_SCHEMA],
  ["prisma/seed.mjs", PRISMA_SEED],

  // styles
  ["src/styles/globals.css", GLOBALS_CSS],

  // app (public)
  ["src/app/layout.tsx", APP_LAYOUT],
  ["src/app/page.tsx", APP_HOME],
  ["src/app/(public)/layout.tsx", PUBLIC_LAYOUT],
  ["src/app/(public)/signin/page.tsx", SIGNIN_PAGE],
  ["src/app/(public)/verify/page.tsx", VERIFY_PAGE],

  // owner
  ["src/app/(owner)/layout.tsx", OWNER_LAYOUT],
  ["src/app/(owner)/dashboard/page.tsx", OWNER_DASH],
  ["src/app/(owner)/organizations/page.tsx", OWNER_ORGS_PAGE],
  ["src/app/(owner)/organizations/actions.ts", OWNER_ORGS_ACTIONS],
  ["src/app/(owner)/modules/page.tsx", OWNER_MODULES_PAGE],
  ["src/app/(owner)/modules/actions.ts", OWNER_MODULES_ACTIONS],
  ["src/app/(owner)/integrations/page.tsx", OWNER_INTEGRATIONS_PAGE],
  ["src/app/(owner)/integrations/actions.ts", OWNER_INTEGRATIONS_ACTIONS],

  // org
  ["src/app/[orgId]/layout.tsx", ORG_LAYOUT],
  ["src/app/[orgId]/dashboard/page.tsx", ORG_DASH],
  ["src/app/[orgId]/onboarding/page.tsx", ORG_ONBOARDING],
  ["src/app/[orgId]/uploads/page.tsx", ORG_UPLOADS],

  // services
  ["src/app/[orgId]/services/receptionist/page.tsx", servicePage("RECEPTIONIST")],
  ["src/app/[orgId]/services/after-hours/page.tsx", servicePage("AFTER_HOURS")],
  ["src/app/[orgId]/services/review-manager/page.tsx", servicePage("REVIEW_MANAGER")],
  ["src/app/[orgId]/services/reactivation/page.tsx", servicePage("REACTIVATION")],
  ["src/app/[orgId]/services/speed-to-lead/page.tsx", servicePage("SPEED_TO_LEAD")],
  ["src/app/[orgId]/services/cart-recovery/page.tsx", servicePage("CART_RECOVERY")],

  // api (auth-only)
  ["src/app/api/auth/otp/request/route.ts", API_OTP_REQUEST],
  ["src/app/api/auth/otp/verify/route.ts", API_OTP_VERIFY],
  ["src/app/api/auth/signout/route.ts", API_SIGNOUT],
  ["src/app/api/auth/whoami/route.ts", API_WHOAMI],
  ["src/app/api/auth/impersonate/route.ts", API_IMPERSONATE],

  // lib
  ["src/lib/prisma/client.ts", PRISMA_CLIENT],
  ["src/lib/auth/crypto.ts", CRYPTO],
  ["src/lib/auth/session.ts", SESSION],
  ["src/lib/utils/audit.ts", AUDIT],
  ["src/lib/validation/integrations.ts", VALIDATION_INTEGRATIONS],

  // server
  ["src/server/sheets/published.ts", SHEETS_PUBLISHED],

  // components
  ["src/components/navigation/OwnerSidebar.tsx", OWNER_SIDEBAR],
  ["src/components/navigation/ClientSidebar.tsx", CLIENT_SIDEBAR],
  ["src/components/navigation/OrgSwitcher.tsx", ORG_SWITCHER],
  ["src/components/results/ResultsTable.tsx", RESULTS_TABLE],
]);

async function main() {
  log("Scaffolding →", process.cwd());
  if (DRY) warn("Dry-run mode ON (no writes).");
  if (!FORCE) warn("Existing files are skipped unless --force is used.");

  // remove TS variants that confuse Next/PostCSS
  await rmIf("postcss.config.ts");
  await rmIf("tailwind.config.ts");

  for (const [rel, content] of files.entries()) {
    await writeFile(rel, content);
  }

  log("\n✅ Scaffold complete.");
  log("Next steps:");
  log("  1) pnpm install");
  log("  2) Create .env (copy from .env.example) incl. DATABASE_URL");
  log("  3) pnpm prisma:migrate && pnpm prisma:generate");
  log("  4) pnpm dev  → open http://localhost:3000 and confirm the smoke test styles");
}

main().catch((e) => { console.error(e); process.exit(1); });
