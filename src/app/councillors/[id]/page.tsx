import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { initials } from "@/lib/initials";
import { getCouncillorAccountability } from "@/lib/metrics";
import { TOPIC_LABELS } from "@/lib/labels";

export default async function CouncillorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const councillor = await prisma.councillor.findUnique({
    where: { id },
    include: {
      council: true,
      ward: { include: { council: true } },
      posts: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!councillor) notFound();

  const isClaimed = councillor.userId !== null;
  const councilName = councillor.ward?.council.name ?? councillor.council?.name;
  const location = [councillor.ward?.name, councilName].filter(Boolean).join(", ");

  const stats = await getCouncillorAccountability(councillor.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex flex-col gap-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start">
        <div className="flex h-20 w-20 flex-none items-center justify-center rounded-full bg-slate-200 text-2xl font-semibold text-slate-600">
          {initials(councillor.name)}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{councillor.name}</h1>
          <p className="text-slate-500">
            {[councillor.party, location].filter(Boolean).join(" · ")}
          </p>
          {councillor.role && councillor.role !== "Councillor" && (
            <p className="mt-1 text-sm font-medium text-slate-600">{councillor.role}</p>
          )}
          {councillor.bio && <p className="mt-3 text-slate-700">{councillor.bio}</p>}
          {!isClaimed && (
            <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-500">
              <p>
                This is a public-record listing. This councillor hasn&apos;t joined the platform
                yet, so messages sent here won&apos;t reach them.
              </p>
              {councillor.email && (
                <p className="mt-2">
                  Official contact:{" "}
                  <a className="font-medium text-slate-700 underline" href={`mailto:${councillor.email}`}>
                    {councillor.email}
                  </a>
                </p>
              )}
            </div>
          )}
          {isClaimed && (
            <Link
              href={`/contact/${councillor.id}`}
              className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700"
            >
              Contact {councillor.name.split(" ")[0]}
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Issues resolved" value={String(stats.resolvedCount)} />
        <Stat
          label="Responsiveness"
          value={stats.responsivenessScore !== null ? `${stats.responsivenessScore}%` : "—"}
        />
        <Stat label="Total contacts" value={String(stats.total)} />
      </div>

      {stats.publishedResolutions.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900">Recent accountability wins</h2>
          <p className="text-sm text-slate-500">
            Cases the councillor has chosen to share publicly after resolving them.
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {stats.publishedResolutions.map((s, i) => (
              <li key={i} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {TOPIC_LABELS[s.topic]}
                </p>
                <p className="mt-1 font-medium text-slate-900">{s.subject}</p>
                <p className="mt-1 text-sm text-slate-600">{s.publishedSummary}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">Recent posts</h2>
        {councillor.posts.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No posts yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {councillor.posts.map((post) => (
              <li key={post.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-900">{post.title}</p>
                <p className="mt-1 text-sm text-slate-600">{post.body}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {post.createdAt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
