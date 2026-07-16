import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { initials } from "@/lib/initials";

export default async function CouncilPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const council = await prisma.council.findUnique({
    where: { slug },
    include: {
      councillors: { orderBy: { name: "asc" } },
    },
  });

  if (!council) notFound();

  // Group councillors by party for easier scanning.
  const byParty = new Map<string, typeof council.councillors>();
  for (const c of council.councillors) {
    const key = c.party ?? "Other";
    const list = byParty.get(key) ?? [];
    list.push(c);
    byParty.set(key, list);
  }
  const parties = [...byParty.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-sm text-slate-500">Council</p>
      <h1 className="text-3xl font-bold text-slate-900">{council.name}</h1>

      <p className="mt-6 text-sm text-slate-500">
        {council.councillors.length} councillors
      </p>

      <div className="mt-4 flex flex-col gap-8">
        {parties.map(([party, members]) => (
          <section key={party}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              {party} &middot; {members.length}
            </h2>
            <div className="flex flex-col gap-3">
              {members.map((c) => (
                <Link
                  key={c.id}
                  href={`/councillors/${c.id}`}
                  className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-400"
                >
                  <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                    {initials(c.name)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{c.name}</p>
                    {c.role && c.role !== "Councillor" && (
                      <p className="text-xs text-slate-500">{c.role}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
