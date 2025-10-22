export function toCsv(rows: Record<string, any>[], headerOrder?: string[]) {
  if (!rows?.length) return "";
  const keys = headerOrder?.length ? headerOrder : Array.from(new Set(rows.flatMap(r => Object.keys(r))));
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = [keys.join(",")];
  for (const r of rows) lines.push(keys.map(k => esc(r[k])).join(","));
  return lines.join("\n");
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
