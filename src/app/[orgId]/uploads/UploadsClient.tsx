"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { LoadingButton } from "@/components/ui/loading-button";
import { Upload, X } from "lucide-react";

type Props = { orgId: string };

const BYTES_IN_MB = 1024 * 1024;
const DEFAULT_MAX_MB = Number(process.env.NEXT_PUBLIC_UPLOADS_MAX_MB || 25); // per-file cap
const DEFAULT_TOTAL_MAX_MB = Number(process.env.NEXT_PUBLIC_UPLOADS_TOTAL_MAX_MB || 200); // total cap

export default function UploadsClient({ orgId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_UPLOADS_URL;

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    // de-dup by name+size (simple heuristic)
    const map = new Map(files.map(f => [f.name + ":" + f.size, f]));
    for (const f of arr) map.set(f.name + ":" + f.size, f);
    setFiles(Array.from(map.values()));
  }, [files]);

  function onPickClick() {
    inputRef.current?.click();
  }

  function onPickChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    addFiles(e.target.files);
    // reset so the same file can be re-picked later
    e.currentTarget.value = "";
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }
  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files?.length) {
      addFiles(e.dataTransfer.files);
    }
  }

  function removeAt(i: number) {
    setFiles(prev => prev.filter((_, idx) => idx !== i));
  }

  function pretty(n: number) {
    if (n >= BYTES_IN_MB) return `${(n / BYTES_IN_MB).toFixed(1)} MB`;
    return `${n} B`;
    // (deliberately simple)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!webhookUrl) {
      toast.error("Missing NEXT_PUBLIC_WEBHOOK_UPLOADS_URL");
      return;
    }
    if (files.length === 0) {
      toast.error("Pick or drop at least one file.");
      return;
    }

    // Validate sizes
    const maxBytes = DEFAULT_MAX_MB * BYTES_IN_MB;
    const totalBytes = files.reduce((a, f) => a + f.size, 0);
    const totalCap = DEFAULT_TOTAL_MAX_MB * BYTES_IN_MB;
    for (const f of files) {
      if (f.size > maxBytes) {
        toast.error(`"${f.name}" exceeds ${DEFAULT_MAX_MB} MB.`);
        return;
      }
    }
    if (totalBytes > totalCap) {
      toast.error(`Total exceeds ${DEFAULT_TOTAL_MAX_MB} MB.`);
      return;
    }

    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("orgId", orgId);
        for (const f of files) fd.append("files", f, f.name);

        const res = await fetch(webhookUrl, { method: "POST", body: fd });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(t || "Upload failed");
        }
        toast.success("Uploaded successfully");
        setFiles([]); // reset on success
      } catch (err: any) {
        toast.error(err?.message ?? "Upload failed");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-4xl">
      {/* Dropzone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={[
          "relative w-full rounded border-2 border-dashed p-10 text-center transition",
          dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30 bg-muted/20",
        ].join(" ")}
      >
        <div className="mx-auto flex max-w-md flex-col items-center gap-2">
          <Upload className="h-8 w-8 opacity-70" />
          <div className="text-sm font-medium">Drag & Drop files here</div>
          <div className="text-xs text-muted-foreground">or</div>
          <button
            type="button"
            onClick={onPickClick}
            className="rounded border px-3 py-1.5 text-sm"
            disabled={isPending}
          >
            Choose files
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            onChange={onPickChange}
            className="hidden"
          />
          <div className="mt-2 text-xs text-muted-foreground">
            Per-file max: {DEFAULT_MAX_MB} MB • Total max: {DEFAULT_TOTAL_MAX_MB} MB
          </div>
        </div>
      </div>

      {/* Selected list */}
      {files.length > 0 && (
        <div className="mt-4 rounded border">
          <div className="border-b bg-muted/40 p-2 text-sm font-medium">Selected Files</div>
          <ul className="divide-y">
            {files.map((f, i) => (
              <li key={f.name + ":" + f.size} className="flex items-center justify-between gap-3 p-2">
                <div className="min-w-0 truncate text-sm">
                  {f.name}
                  <span className="ml-2 text-xs text-muted-foreground">{pretty(f.size)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs"
                  disabled={isPending}
                  aria-label={`Remove ${f.name}`}
                  title="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Submit */}
      <div className="mt-4">
        <LoadingButton type="submit" loading={isPending}>
          Upload
        </LoadingButton>
      </div>
    </form>
  );
}
