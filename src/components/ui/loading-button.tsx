import * as React from "react";
import { Spinner } from "./spinner";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  spinnerSize?: "xs" | "sm";
};

export function LoadingButton({ loading, spinnerSize = "xs", children, className = "", disabled, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={loading || disabled}
      className={`inline-flex items-center justify-center gap-2 rounded border px-3 py-2 text-sm disabled:opacity-60 ${className}`}
    >
      {loading ? <Spinner size={spinnerSize} label="Submitting" /> : null}
      <span>{children}</span>
    </button>
  );
}
