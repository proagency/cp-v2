// src/server/sheets/published.ts
import { cache } from "react";

export type Row = Record<string, string>;

function parseCsv(csv: string): Row[] {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const split = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (q && line[i + 1] === '"') { cur += '"'; i++; } else { q = !q; }
      } else if (c === "," && !q) { out.push(cur); cur = ""; }
      else { cur += c; }
    }
    out.push(cur);
    return out;
  };
  const headers = split(lines[0]).map((h) => h.replace(/^"|"$/g, "").trim());
  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = split(lines[i]).map((v) => v.replace(/^"|"$/g, "").trim());
    const obj: Row = {};
    for (let j = 0; j < headers.length; j++) obj[headers[j]] = cells[j] ?? "";
    rows.push(obj);
  }
  return rows;
}

export const fetchPublishedCsv = cache(
  async (sheetId: string, gid: number | string, revalidateSec = 300): Promise<Row[]> => {
    const url = new URL(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq`);
    url.searchParams.set("tqx", "out:csv");
    url.searchParams.set("gid", String(gid));
    const res = await fetch(url.toString(), { next: { revalidate: revalidateSec } });
    if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
    const csv = await res.text();
    return parseCsv(csv);
  }
);

export async function fetchPublishedCsvSafe(opts: {
  sheetId: string;
  gid: number | string;
  revalidateSec?: number;
}): Promise<{ rows: Row[]; error?: string }> {
  try {
    const rows = await fetchPublishedCsv(opts.sheetId, opts.gid, opts.revalidateSec ?? 300);
    return { rows };
  } catch (e: any) {
    return { rows: [], error: e?.message ?? "Failed to load CSV" };
  }
}
