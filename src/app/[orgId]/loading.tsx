import { Spinner } from "@/components/ui/spinner";

export default function OrgLoading() {
  return (
    <div className="grid min-h-[60dvh] place-items-center p-6">
      <div className="flex items-center gap-3">
        <Spinner />
        <span className="text-sm text-muted-foreground">Loading organization…</span>
      </div>
    </div>
  );
}
