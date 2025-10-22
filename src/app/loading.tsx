import { Spinner } from "@/components/ui/spinner";

export default function RootLoading() {
  return (
    <div className="grid min-h-dvh place-items-center p-6">
      <div className="flex items-center gap-3">
        <Spinner />
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    </div>
  );
}
