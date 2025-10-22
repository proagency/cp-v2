"use client";
import * as React from "react";

export function SearchInput({
  value, onChange, placeholder = "Search…", className = "",
}: { value: string; onChange: (v: string)=>void; placeholder?: string; className?: string; }) {
  return (
    <input
      value={value}
      onChange={(e)=>onChange(e.target.value)}
      className={"w-full rounded border px-3 py-2 text-sm " + className}
      placeholder={placeholder}
    />
  );
}
