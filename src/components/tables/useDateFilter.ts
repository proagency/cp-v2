"use client";
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
    const m = s.match(/^(\d{1,2})[\/](\d{1,2})[\/](\d{2,4})$/);
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
