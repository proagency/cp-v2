import * as React from "react";

type SpinnerProps = {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  label?: string; // screen-reader text
};

const SIZE = {
  xs: "h-3 w-3 border-2",
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-2",
};

export function Spinner({ size = "md", className = "", label = "Loading" }: SpinnerProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`relative inline-block animate-spin rounded-full border-transparent border-t-current ${SIZE[size]} ${className}`}
        role="status"
        aria-label={label}
        aria-live="polite"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
