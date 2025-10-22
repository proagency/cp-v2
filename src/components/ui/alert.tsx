export function Alert({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
      <div className="font-medium text-destructive-foreground">{title}</div>
      {description ? <div className="mt-1 text-destructive-foreground/90">{description}</div> : null}
    </div>
  );
}
