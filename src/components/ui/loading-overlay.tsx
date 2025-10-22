import * as React from "react";
import { Spinner } from "./spinner";

type Props = {
  label?: string;
  /** If true, cover viewport; else fill parent */
  fullscreen?: boolean;
};

export function LoadingOverlay({ label = "Loading", fullscreen = false }: Props) {
  return (
    <div
      className={`pointer-events-none ${fullscreen ? "fixed inset-0" : "absolute inset-0"} z-50 grid place-items-center bg-background/60 backdrop-blur-sm`}
    >
      <div className="pointer-events-auto rounded-md border bg-background/90 p-4 shadow">
        <div className="flex items-center gap-3">
          <Spinner />
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
      </div>
    </div>
  );
}
