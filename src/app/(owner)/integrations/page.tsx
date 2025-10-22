import { prisma } from "@/lib/prisma/client";
import { saveSheetConfig } from "./actions";

export default async function IntegrationsPage() {
  const orgs = await prisma.organization.findMany({ orderBy: { name: "asc" } });
  return (
    <main className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Integrations (Google Sheets)</h1>
      <div className="space-y-6">
        {orgs.map(o => (
          <form key={o.id} action={saveSheetConfig} className="rounded border p-4">
            <input type="hidden" name="orgId" value={o.id} />
            <div className="mb-2 text-sm font-medium">{o.name}</div>
            <div className="mb-2">
              <label className="block text-xs">Sheet ID</label>
              <input name="sheetId" defaultValue={o.sheetId} className="w-full rounded border px-3 py-2 text-sm" required />
            </div>
            <div className="mb-2">
              <label className="block text-xs">GID Map (JSON with all 6 keys)</label>
              <textarea name="sheetGidMap" defaultValue={JSON.stringify(o.sheetGidMap ?? {}, null, 2)} rows={6} className="w-full rounded border px-3 py-2 text-xs font-mono" required />
            </div>
            <button className="rounded border px-3 py-2 text-sm">Save</button>
          </form>
        ))}
      </div>
    </main>
  );
}
