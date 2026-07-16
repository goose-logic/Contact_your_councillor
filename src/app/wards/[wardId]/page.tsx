import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { initials } from "@/lib/initials";
import { getCouncillorAccountability } from "@/lib/metrics";

export default async function WardPage({
  params,
}: {
  params: Promise<{ wardId: string }>;
}) {
  const { wardId } = await params;

  const ward = await prisma.ward.findUnique({
    where: { id: wardId },
    include: {
      council: true,
      councillors: { orderBy: { name: "asc" } },
    },
  });

  if (!ward) notFound();

  const councillorsWithStats = await Promise.all(
    ward.councillors.map(async (c) => ({
      councillor: c,
      stats: await getCouncillorAccountability(c.id),
    }))
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm text-slate-500">{ward.council.name}</p>
      <h1 className="text-3xl font-bold text-slate-900">{ward.name} ward</h1>

      {councillorsWithStats.length === 0 ? (
        <p className="mt-8 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
          Councillor details for this ward are still being verified following the May 2026
          elections. Check back soon.
        </p>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {councillorsWithStats.map(({ councillor, stats }) => (
            <Link
              key={councillor.id}
              href={`/councillors/${councillor.id}`}
              className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-400"
            >
              <div className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-600">
                {initials(councillor.name)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{councillor.name}</p>
                <p className="text-sm text-slate-500">{councillor.party}</p>
              </div>
              {stats.responsivenessScore !== null && (
                <div className="text-right text-sm text-slate-500">
                  <p className="font-semibold text-slate-900">{stats.responsivenessScore}%</p>
                  <p>responsiveness</p>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
