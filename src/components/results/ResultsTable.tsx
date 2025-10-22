"use client";

import * as React from "react";
import ServiceTableToolbar from "@/components/tables/ServiceTableToolbar";
import { useDateFilter } from "@/components/tables/useDateFilter";

// Minimal shape: array of { [columnName]: string }
type Props = {
  rows: Record<string, any>[];
  dateKey?: string;           // default: tries "date" or "Date"
  filename?: string;          // default: results.csv
  headerOrder?: string[];     // optional stable order
};

export default function ResultsTable({
  rows,
  dateKey,
  filename = "results.csv",
  headerOrder,
}: Props) {
  const dk = React.useMemo(() => {
    if (dateKey) return dateKey;
    // naive guess
    const keys = Object.keys(rows[0] ?? {});
    return keys.find((k) => k.toLowerCase() === "date") ?? keys[0] ?? "date";
  }, [rows, dateKey]);

  const { filtered, setRange } = useDateFilter(rows, dk as any);

  // optional text search (client)
  const [q, setQ] = React.useState("");
  const searched = React.useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return filtered;
    return filtered.filter((r) =>
      Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(n))
    );
  }, [filtered, q]);

  const columns = React.useMemo(() => Object.keys(searched[0] ?? rows[0] ?? {}), [searched, rows]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <ServiceTableToolbar
          allRows={rows}
          filteredRows={searched}
          onRangeChange={setRange}
          dateKey={dk as any}
          filename={filename}
          headerOrder={headerOrder}
        />
        <div className="flex items-center gap-2">
          <input
            placeholder="Search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="rounded border px-2 py-1 text-sm"
          />
        </div>
      </div>

      <div className="overflow-auto rounded border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((k) => (
                <th key={k} className="p-2 text-left">{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {searched.map((r, i) => (
              <tr key={i} className="border-t">
                {columns.map((k) => (
                  <td key={k} className="p-2">{String(r[k] ?? "—")}</td>
                ))}
              </tr>
            ))}
            {searched.length === 0 && (
              <tr>
                <td className="p-3 text-muted-foreground">No results</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
