import { Spinner } from "@/components/ui/spinner";

export default function ServicesLoading() {
  return (
    <div className="grid min-h-[50dvh] place-items-center p-6">
      <div className="flex items-center gap-3">
        <Spinner />
        <span className="text-sm text-muted-foreground">Loading results…</span>
      </div>
    </div>
  );
}
