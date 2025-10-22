export type DateRange = { start: Date; end: Date };

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
