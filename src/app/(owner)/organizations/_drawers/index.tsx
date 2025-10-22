"use client";
import { useRouter } from "next/navigation";
import { openDrawer } from "@/components/ui/right-drawer";
import { OwnerTable } from "@/components/ui/owner-table";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RightDrawer, useDrawerState, closeDrawer } from "@/components/ui/right-drawer";
import { Spinner } from "@/components/ui/spinner";

type Org = { id: string; name: string; slug: string; sheetId: string | null; createdAt: string };

export default function OrganizationsDrawers() {
  const router = useRouter();

  // Wire buttons on the table by mounting event listeners
  useEffect(() => {
    // The OwnerTable inline handlers are placeholders; we delegate with events
    const add = () => openDrawer(router, "org.new");
    const edit = (e: any) => {
      const id = e.detail?.id as string;
      if (id) openDrawer(router, "org.edit", { id });
    };
    const del = (e: any) => {
      const id = e.detail?.id as string;
      if (id) openDrawer(router, "org.delete", { id });
    };

    window.addEventListener("owner.org.add", add as any);
    window.addEventListener("owner.org.edit", edit as any);
    window.addEventListener("owner.org.delete", del as any);
    return () => {
      window.removeEventListener("owner.org.add", add as any);
      window.removeEventListener("owner.org.edit", edit as any);
      window.removeEventListener("owner.org.delete", del as any);
    };
  }, [router]);

  return (
    <>
      <NewOrgDrawer />
      <EditOrgDrawer />
      <DeleteOrgDrawer />
    </>
  );
}

// --- New
function NewOrgDrawer() {
  const { value } = useDrawerState();
  if (value !== "org.new") return null;
  return (
    <RightDrawer title="New Organization" description="Create a new client organization">
      <OrgForm mode="create" />
    </RightDrawer>
  );
}

// --- Edit
import { useSearchParams } from "next/navigation";

function EditOrgDrawer() {
  const { value } = useDrawerState();
  const sp = useSearchParams();
  if (value !== "org.edit") return null;

  // read id reactively from URL; while it's not present, show a loader
  const id = sp.get("id");

  return (
    <RightDrawer title="Edit Organization">
      {!id ? (
        <div className="grid min-h-[160px] place-items-center p-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-transparent border-t-current" />
        </div>
      ) : (
        <OrgForm mode="edit" id={id} />
      )}
    </RightDrawer>
  );
}

// --- Delete confirm
function DeleteOrgDrawer() {
  const sp = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const router = useRouter();
  const { value } = useDrawerState();
  if (value !== "org.delete") return null;
  const id = sp.get("id");
  async function onDelete() {
    try {
      const res = await fetch("/organizations/server-actions", {
        method: "POST", headers: { "content-type":"application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Deleted");
      closeDrawer(router);
      router.refresh();
    } catch (e:any) {
      toast.error(e.message ?? "Failed");
    }
  }
  return (
    <RightDrawer title="Delete Organization">
      <div className="space-y-4">
        <p className="text-sm">This will remove the organization. This action cannot be undone.</p>
        <div className="flex gap-2">
          <button onClick={()=>closeDrawer(router)} className="rounded border px-3 py-2 text-sm">Cancel</button>
          <button onClick={onDelete} className="rounded border border-destructive bg-destructive/10 px-3 py-2 text-sm">Delete</button>
        </div>
      </div>
    </RightDrawer>
  );
}

// --- Shared form
function OrgForm({ mode, id }: { mode: "create" | "edit"; id?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(mode === "edit");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sheetId, setSheetId] = useState("");

  useEffect(() => {
    if (mode !== "edit" || !id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/organizations/server-actions?id=" + encodeURIComponent(id));
        if (!res.ok) throw new Error("Load failed");
        const j = await res.json();
        setName(j.name ?? "");
        setSlug(j.slug ?? "");
        setSheetId(j.sheetId ?? "");
      } catch (e:any) {
        setLoadError(e?.message ?? "Load failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [mode, id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const res = await fetch("/organizations/server-actions", {
        method: "POST",
        headers: { "content-type":"application/json" },
        body: JSON.stringify({
          action: mode === "create" ? "create" : "update",
          id, name, slug, sheetId: sheetId || null
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        throw new Error(j.error ?? "Save failed");
      }
      toast.success(mode === "create" ? "Organization created" : "Organization updated");
      closeDrawer(router);
      router.refresh();
    } catch (e:any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setPending(false);
    }
  }

  if (mode === "edit" && !id) {
    return (
      <div className="grid min-h-[160px] place-items-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-transparent border-t-current" />
      </div>
    );
  }
  if (loading) return <div className="grid min-h-[120px] place-items-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-transparent border-t-current" /></div>;
  if (loadError) {
    return (
      <div className="space-y-3">
        <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <div className="font-medium">Failed to load organization</div>
          <div className="text-destructive-foreground/90">{loadError}</div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="block text-xs">Name</label>
        <input className="w-full rounded border px-3 py-2 text-sm" value={name} onChange={(e)=>setName(e.target.value)} required />
      </div>
      <div>
        <label className="block text-xs">Slug</label>
        <input className="w-full rounded border px-3 py-2 text-sm" value={slug} onChange={(e)=>setSlug(e.target.value)} required />
      </div>
      <div>
        <label className="block text-xs">Sheet ID (optional)</label>
        <input className="w-full rounded border px-3 py-2 text-sm" value={sheetId} onChange={(e)=>setSheetId(e.target.value)} placeholder="1aBcD... (from sheet URL)" />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={()=>closeDrawer(router)} className="rounded border px-3 py-2 text-sm">Cancel</button>
        <button disabled={pending} className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm">
          {pending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" /> : null}
          <span>{mode === "create" ? "Create" : "Save"}</span>
        </button>
      </div>
    </form>
  );
}
