"use client";
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
          onClick={()=>downloadCsv(filename.replace(/\.csv$/, "") + "-filtered.csv", filteredRows as any[], headerOrder)}
          className="rounded border px-2 py-1 text-xs"
        >
          Export Filtered CSV
        </button>
        <button
          onClick={()=>downloadCsv(filename.replace(/\.csv$/, "") + "-all.csv", allRows as any[], headerOrder)}
          className="rounded border px-2 py-1 text-xs"
        >
          Export ALL
        </button>
      </div>
    </div>
  );
}
