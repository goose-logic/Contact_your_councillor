import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { lookupPostcode } from "@/lib/postcodes";
import { resolveCouncilKey, wardKey } from "@/lib/borough";
import { initials } from "@/lib/initials";

type CouncillorCard = {
  id: string;
  name: string;
  party: string | null;
  role: string | null;
};

async function resolveTier(councilName: string, wardName: string | null) {
  const council = await prisma.council.findFirst({
    where: { matchKey: resolveCouncilKey(councilName) },
    select: { id: true, name: true, slug: true, _count: { select: { councillors: true } } },
  });
  if (!council) return { councilName, council: null, ward: null, councillors: [] as CouncillorCard[] };

  let councillors: CouncillorCard[] = [];
  let matchedWard: string | null = null;

  if (wardName) {
    const ward = await prisma.ward.findFirst({
      where: { councilId: council.id, matchKey: wardKey(wardName) },
      select: {
        name: true,
        councillors: {
          orderBy: { name: "asc" },
          select: { id: true, name: true, party: true, role: true },
        },
      },
    });
    if (ward) {
      matchedWard = ward.name;
      councillors = ward.councillors;
    }
  }

  return { councilName, council, ward: matchedWard, councillors };
}

export default async function FindPage({
  searchParams,
}: {
  searchParams: Promise<{ postcode?: string }>;
}) {
  const { postcode } = await searchParams;

  if (!postcode) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-slate-600">
        <p>No postcode provided.</p>
        <Link href="/" className="mt-4 inline-block font-medium text-slate-900 underline">
          Search again
        </Link>
      </div>
    );
  }

  const result = await lookupPostcode(postcode);

  if (!result.ok) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Hmm, that didn&apos;t work</h1>
        <p className="mt-2 text-slate-600">{result.error}</p>
        <Link href="/" className="mt-6 inline-block rounded-md bg-slate-900 px-4 py-2 font-medium text-white">
          Try another postcode
        </Link>
      </div>
    );
  }

  const tiers = [];
  // Lower tier: district / borough / unitary, matched by district ward.
  tiers.push({ label: "Local council", ...(await resolveTier(result.district, result.ward)) });
  // Upper tier: county council (two-tier areas only), matched by electoral division.
  if (result.county) {
    tiers.push({ label: "County council", ...(await resolveTier(result.county, result.division)) });
  }

  const anyFound = tiers.some((t) => t.councillors.length > 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-sm text-slate-500">Councillors for</p>
      <h1 className="text-3xl font-bold text-slate-900">{result.postcode}</h1>

      {!anyFound && (
        <p className="mt-6 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600">
          We found your area but couldn&apos;t pin down your exact ward&apos;s councillors. You can
          still browse your council below.
        </p>
      )}

      <div className="mt-8 flex flex-col gap-10">
        {tiers.map((tier) => (
          <section key={tier.label}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                {tier.council?.name ?? tier.councilName}
              </h2>
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {tier.label}
              </span>
            </div>
            {tier.ward ? (
              <p className="text-sm text-slate-500">{tier.ward}</p>
            ) : (
              <p className="text-sm text-slate-500">Ward couldn&apos;t be matched automatically</p>
            )}

            {tier.councillors.length > 0 ? (
              <div className="mt-3 flex flex-col gap-3">
                {tier.councillors.map((c) => (
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
                      <p className="text-sm text-slate-500">
                        {[c.party, c.role && c.role !== "Councillor" ? c.role : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">
                {tier.council ? (
                  <>
                    Couldn&apos;t match your exact ward.{" "}
                    <Link href={`/councils/${tier.council.slug}`} className="font-medium text-slate-900 underline">
                      Browse all {tier.council._count.councillors} {tier.council.name} councillors
                    </Link>
                    .
                  </>
                ) : (
                  <>We don&apos;t have {tier.councilName} loaded yet.</>
                )}
              </p>
            )}

            {tier.council && tier.councillors.length > 0 && (
              <Link
                href={`/councils/${tier.council.slug}`}
                className="mt-3 inline-block text-sm font-medium text-slate-600 underline"
              >
                See all {tier.council._count.councillors} {tier.council.name} councillors
              </Link>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
