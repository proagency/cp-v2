"use client";

import * as React from "react";
import { SearchInput } from "./search-input";

type Column = {
  key: string;           // plain field key on the row
  label: string;
  width?: string;
};

type Props = {
  title: string;
  rows: Record<string, any>[];
  columns: Column[];
  idKey: string;                 // e.g. "id"
  searchKeys?: string[];         // e.g. ["name","slug","sheetId"]
  addLabel?: string;             // e.g. "Add New"
  eventPrefix: string;           // e.g. "owner.org" -> will emit owner.org.add/edit/delete
  showActions?: boolean;         // default true
};

export function OwnerTable({
  title,
  rows,
  columns,
  idKey,
  searchKeys = [],
  addLabel = "Add New",
  eventPrefix,
  showActions = true,
}: Props) {
  const [q, setQ] = React.useState("");

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(needle))
    );
  }, [rows, q, searchKeys]);

  function emit(name: "add" | "edit" | "delete", detail?: any) {
    const ev = new CustomEvent(`${eventPrefix}.${name}`, { detail });
    window.dispatchEvent(ev);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">{title}</h1>
        <button
          onClick={() => emit("add")}
          className="rounded border px-3 py-2 text-sm"
        >
          + {addLabel}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <SearchInput value={q} onChange={setQ} className="max-w-sm" />
      </div>

      <div className="overflow-auto rounded border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="p-2 text-left"
                  style={{ width: c.width }}
                >
                  {c.label}
                </th>
              ))}
              {showActions ? <th className="p-2 text-left">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const id = String(row[idKey] ?? "");
              return (
                <tr key={id} className="border-t">
                  {columns.map((c) => (
                    <td key={c.key} className="p-2">
                      {String(row[c.key] ?? "—")}
                    </td>
                  ))}
                  {showActions ? (
                    <td className="p-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => emit("edit", { id })}
                          className="rounded border px-2 py-1 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => emit("delete", { id })}
                          className="rounded border px-2 py-1 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + (showActions ? 1 : 0)}
                  className="p-3 text-muted-foreground"
                >
                  No results
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
