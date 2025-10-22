import { prisma } from "@/lib/prisma/client";
import { toggleModule } from "./actions";
import { ModuleKey } from "@prisma/client";
const MODULES: ModuleKey[] = ["RECEPTIONIST","AFTER_HOURS","REVIEW_MANAGER","REACTIVATION","SPEED_TO_LEAD","CART_RECOVERY"];

export default async function ModulesPage() {
  const orgs = await prisma.organization.findMany({ include: { moduleGrants: true }, orderBy: { name: "asc" } });
  return (
    <main className="p-6">
      <h1 className="mb-4 text-xl font-semibold">Modules (Grants)</h1>
      <div className="overflow-auto rounded border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr><th className="p-2 text-left">Organization</th>{MODULES.map(m => <th key={m} className="p-2 text-left">{m}</th>)}</tr>
          </thead>
          <tbody>
            {orgs.map(o => {
              const gm = Object.fromEntries(o.moduleGrants.map(g=>[g.module,g.enabled]));
              const map = o.sheetGidMap as Record<string,number>;
              return (
                <tr key={o.id} className="border-t">
                  <td className="p-2 font-medium">{o.name}</td>
                  {MODULES.map(m => (
                    <td key={m} className="p-2">
                      <form action={toggleModule} className="flex items-center gap-2">
                        <input type="hidden" name="orgId" value={o.id} />
                        <input type="hidden" name="module" value={m} />
                        <input type="hidden" name="enabled" value={(!gm[m]) ? "true" : "false"} />
                        <button className="rounded border px-2 py-1 text-xs">{gm[m] ? "Disable" : "Enable"}</button>
                        <span className="text-[11px] text-muted-foreground">GID {typeof map?.[m]==="number" ? map[m] : "⚠︎"}</span>
                      </form>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
