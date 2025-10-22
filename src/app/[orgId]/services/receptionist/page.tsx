import { prisma } from "@/lib/prisma/client";
import { fetchPublishedCsvSafe } from "@/server/sheets/published";
import ResultsTable from "@/components/results/ResultsTable";
import { Alert } from "@/components/ui/alert";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { orgId: string } }) {
  const org = await prisma.organization.findUnique({ where: { id: params.orgId } });
  if (!org?.sheetId) return <main className="p-6"><h1 className="text-xl font-semibold">Not configured</h1></main>;

  const map = org.sheetGidMap as Record<string, number>;
  const gid = map?.["RECEPTIONIST"];
  if (typeof gid !== "number") return <main className="p-6"><h1 className="text-xl font-semibold">Tab not configured</h1></main>;

  const { rows, error } = await fetchPublishedCsvSafe({ sheetId: org.sheetId, gid, revalidateSec: 60 });

  return (
    <main className="p-4">
      <h1 className="mb-3 text-lg font-semibold">REVIEW MANAGER Results</h1>
      {error ? <div className="mb-3"><Alert title="Couldn\'t load results" description={error} /></div> : null}
      <ResultsTable rows={rows} />
    </main>
  );
}
