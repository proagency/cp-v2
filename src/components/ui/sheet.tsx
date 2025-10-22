"use client";

import * as React from "react";

type SheetContextType = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
const SheetCtx = React.createContext<SheetContextType | null>(null);

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  // Controlled sheet: expose state via context
  const ctx = React.useMemo(() => ({ open, onOpenChange }), [open, onOpenChange]);
  return <SheetCtx.Provider value={ctx}>{children}</SheetCtx.Provider>;
}

type ContentProps = React.HTMLAttributes<HTMLDivElement> & {
  side?: "right" | "left";
};

export function SheetContent({ side = "right", className = "", children, ...rest }: ContentProps) {
  const ctx = React.useContext(SheetCtx);
  if (!ctx) {
    // Render nothing if used outside <Sheet />
    return null;
  }
  const { open, onOpenChange } = ctx;

  // Basic slide-in styles
  const sideClasses =
    side === "right"
      ? "right-0 translate-x-full data-[open=true]:translate-x-0"
      : "left-0 -translate-x-full data-[open=true]:translate-x-0";

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden
        onClick={() => onOpenChange(false)}
        className={`fixed inset-0 z-[100] bg-black/30 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        data-open={open ? "true" : "false"}
        className={[
          "fixed top-0 z-[101] h-dvh w-[85vw] max-w-md transform bg-background shadow-xl transition-transform duration-200",
          sideClasses,
          className,
        ].join(" ")}
        {...rest}
      >
        {children}
      </div>
    </>
  );
}

export function SheetHeader({ className = "", children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={["space-y-1", className].join(" ")}>{children}</div>;
}

export function SheetTitle({ className = "", children }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={["text-base font-semibold leading-none tracking-tight", className].join(" ")}>{children}</h2>;
}

export function SheetDescription({ className = "", children }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={["text-sm text-muted-foreground", className].join(" ")}>{children}</p>;
}
