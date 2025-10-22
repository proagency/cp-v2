// patch-service-filters.mjs
import { promises as fs } from "node:fs";
import path from "node:path";

const R = (...p) => path.join(process.cwd(), ...p);
const w = async (rel, s) => { await fs.mkdir(path.dirname(R(rel)), { recursive: true }); await fs.writeFile(R(rel), s, "utf8"); console.log("write", rel); };

/* ---------------- lib: date ranges ---------------- */
await w("src/lib/date/ranges.ts", `export type DateRange = { start: Date; end: Date };

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d: Date) { const x = new Date(d); x.setHours(23,59,59,999); return x; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }
function startOfWeek(d: Date) { // Mon start
  const x = startOfDay(d);
  const day = (x.getDay()+6)%7; // 0..6, 0=Mon
  return addDays(x, -day);
}
function endOfWeek(d: Date) {
  const s = startOfWeek(d);
  return endOfDay(addDays(s, 6));
}
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return endOfDay(new Date(d.getFullYear(), d.getMonth()+1, 0)); }

export function quickRange(key: "yesterday"|"today"|"lastWeek"|"thisWeek"|"lastMonth"|"thisMonth"): DateRange {
  const now = new Date();
  if (key === "today") return { start: startOfDay(now), end: endOfDay(now) };
  if (key === "yesterday") {
    const y = addDays(startOfDay(now), -1);
    return { start: startOfDay(y), end: endOfDay(y) };
  }
  if (key === "thisWeek") return { start: startOfWeek(now), end: endOfWeek(now) };
  if (key === "lastWeek") {
    const s = addDays(startOfWeek(now), -7);
    const e = addDays(endOfWeek(now), -7);
    return { start: s, end: e };
  }
  if (key === "thisMonth") return { start: startOfMonth(now), end: endOfMonth(now) };
  // lastMonth
  const s = startOfMonth(new Date(now.getFullYear(), now.getMonth()-1, 1));
  const e = endOfMonth(s);
  return { start: s, end: e };
}

export function clampRange(from?: string, to?: string): DateRange | null {
  if (!from && !to) return null;
  let start = from ? new Date(from + "T00:00:00") : new Date("1970-01-01T00:00:00");
  let end = to ? new Date(to + "T23:59:59.999") : new Date("2999-12-31T23:59:59.999");
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
  if (start > end) [start, end] = [end, start];
  return { start, end };
}
`);

/* ---------------- lib: csv export ---------------- */
await w("src/lib/csv/export.ts", `export function toCsv(rows: Record<string, any>[], headerOrder?: string[]) {
  if (!rows?.length) return "";
  const keys = headerOrder?.length ? headerOrder : Array.from(new Set(rows.flatMap(r => Object.keys(r))));
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = [keys.join(",")];
  for (const r of rows) lines.push(keys.map(k => esc(r[k])).join(","));
  return lines.join("\\n");
}
export function downloadCsv(filename: string, rows: Record<string, any>[], headerOrder?: string[]) {
  const csv = toCsv(rows, headerOrder);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
`);

/* ---------------- ui: toolbar ---------------- */
await w("src/components/tables/ServiceTableToolbar.tsx", `"use client";
import * as React from "react";
import { quickRange, clampRange, type DateRange } from "@/lib/date/ranges";
import { downloadCsv } from "@/lib/csv/export";

type ToolbarProps<T extends Record<string, any>> = {
  allRows: T[];                 // all loaded rows
  filteredRows: T[];            // currently filtered rows (by search/module filters)
  onRangeChange: (range: DateRange | null) => void;
  dateKey: keyof T;             // field containing date string, e.g. "date"
  filename?: string;
  headerOrder?: string[];       // stable CSV header order
};

export default function ServiceTableToolbar<T extends Record<string, any>>({
  allRows, filteredRows, onRangeChange, filename = "export.csv", headerOrder
}: ToolbarProps<T>) {
  const [from, setFrom] = React.useState<string>("");
  const [to, setTo] = React.useState<string>("");

  function applyQuick(k: "yesterday"|"today"|"lastWeek"|"thisWeek"|"lastMonth"|"thisMonth") {
    setFrom(""); setTo("");
    onRangeChange(quickRange(k));
  }
  function applyCustom() {
    const r = clampRange(from, to);
    onRangeChange(r);
  }
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex gap-1">
          <button onClick={()=>applyQuick("today")} className="rounded border px-2 py-1 text-xs">Today</button>
          <button onClick={()=>applyQuick("yesterday")} className="rounded border px-2 py-1 text-xs">Yesterday</button>
          <button onClick={()=>applyQuick("thisWeek")} className="rounded border px-2 py-1 text-xs">This Week</button>
          <button onClick={()=>applyQuick("lastWeek")} className="rounded border px-2 py-1 text-xs">Last Week</button>
          <button onClick={()=>applyQuick("thisMonth")} className="rounded border px-2 py-1 text-xs">This Month</button>
          <button onClick={()=>applyQuick("lastMonth")} className="rounded border px-2 py-1 text-xs">Last Month</button>
        </div>
        <div className="flex items-center gap-1">
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="rounded border px-2 py-1 text-xs" />
          <span className="text-xs text-muted-foreground">to</span>
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="rounded border px-2 py-1 text-xs" />
          <button onClick={applyCustom} className="rounded border px-2 py-1 text-xs">Apply</button>
          <button onClick={()=>{ setFrom(""); setTo(""); onRangeChange(null); }} className="rounded border px-2 py-1 text-xs">Clear</button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={()=>downloadCsv(filename.replace(/\\.csv$/, "") + "-filtered.csv", filteredRows as any[], headerOrder)}
          className="rounded border px-2 py-1 text-xs"
        >
          Export Filtered CSV
        </button>
        <button
          onClick={()=>downloadCsv(filename.replace(/\\.csv$/, "") + "-all.csv", allRows as any[], headerOrder)}
          className="rounded border px-2 py-1 text-xs"
        >
          Export ALL
        </button>
      </div>
    </div>
  );
}
`);

/* ---------------- hook: date filter helper ---------------- */
await w("src/components/tables/useDateFilter.ts", `"use client";
import * as React from "react";
import type { DateRange } from "@/lib/date/ranges";

function parseMaybeDate(v: any): Date | null {
  if (v == null) return null;
  // Try ISO first
  const d1 = new Date(v);
  if (!isNaN(d1.getTime())) return d1;
  // Try common formats (MM/DD/YYYY or DD/MM/YYYY) — naive split
  if (typeof v === "string") {
    const s = v.trim();
    const m = s.match(/^(\\d{1,2})[\\/](\\d{1,2})[\\/](\\d{2,4})$/);
    if (m) {
      const a = parseInt(m[1],10), b = parseInt(m[2],10), c = parseInt(m[3],10);
      const yyyy = c < 100 ? 2000 + c : c;
      // heuristic: if first > 12, treat as DD/MM
      const mm = a > 12 ? b : a;
      const dd = a > 12 ? a : b;
      const d2 = new Date(yyyy, mm-1, dd);
      if (!isNaN(d2.getTime())) return d2;
    }
  }
  return null;
}

export function useDateFilter<T extends Record<string, any>>(rows: T[], dateKey: keyof T) {
  const [range, setRange] = React.useState<DateRange | null>(null);
  const filtered = React.useMemo(() => {
    if (!range) return rows;
    const { start, end } = range;
    return rows.filter(r => {
      const d = parseMaybeDate(r[dateKey]);
      return d && d >= start && d <= end;
    });
  }, [rows, range, dateKey]);
  return { range, setRange, filtered };
}
`);

/* ---------------- example integration (Receptionist) ---------------- */
await w("src/app/[orgId]/services/receptionist/ResultsClient.tsx", `"use client";
import * as React from "react";
import ServiceTableToolbar from "@/components/tables/ServiceTableToolbar";
import { useDateFilter } from "@/components/tables/useDateFilter";

/** Expects rows already loaded from server: an array of objects including a 'date' field */
export default function ReceptionistResultsClient({ rows }: { rows: Record<string, any>[] }) {
  // 1) date filter on 'date' column (adjust if your field is different)
  const { filtered, setRange } = useDateFilter(rows, "date" as any);

  // 2) (Optional) add your own search/text filters here and feed into toolbar's filteredRows

  return (
    <div className="space-y-3">
      <ServiceTableToolbar
        allRows={rows}
        filteredRows={filtered}
        onRangeChange={setRange}
        dateKey={"date"}
        filename={"receptionist.csv"}
        headerOrder={undefined}
      />
      <div className="overflow-auto rounded border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {Object.keys(filtered[0] ?? { date: "", caller: "", message: "" }).map(k => (
                <th key={k} className="p-2 text-left">{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className="border-t">
                {Object.keys(r).map(k => (
                  <td key={k} className="p-2">{String(r[k] ?? "—")}</td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td className="p-3 text-muted-foreground">No results</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`);

/* note: page usage example comment */
await w("src/app/[orgId]/services/receptionist/page.tsx", `import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import ReceptionistResultsClient from "./ResultsClient";
import { fetchPublishedCsv } from "@/server/sheets/published"; // your existing fetcher if present

export default async function Page({ params }: { params: { orgId: string } }) {
  const s = await getSession();
  if (!s) redirect("/signin");

  // load org + sheet info (pseudo; adapt to your real fetch)
  const org = await prisma.organization.findUnique({ where: { id: params.orgId }, select: { sheetId: true, sheetGidMap: true } });
  if (!org?.sheetId || !org.sheetGidMap?.receptionist) {
    return <main className="p-6"><h1 className="text-lg font-semibold">Receptionist</h1><p className="text-sm text-destructive mt-2">Sheet is not configured for this org.</p></main>;
  }

  // Example: fetch rows from published CSV
  let rows: any[] = [];
  try {
    rows = await fetchPublishedCsv(org.sheetId, org.sheetGidMap.receptionist);
  } catch {
    rows = [];
  }

  return (
    <main className="p-6">
      <h1 className="mb-2 text-lg font-semibold">Receptionist</h1>
      <ReceptionistResultsClient rows={rows} />
    </main>
  );
}
`);

console.log("✅ Date filters + CSV export toolbar added. Integrate on other services by reusing ServiceTableToolbar + useDateFilter.");
