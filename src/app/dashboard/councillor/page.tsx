import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { CATEGORY_LABELS, TOPIC_LABELS } from "@/lib/labels";
import { getCouncillorAccountability } from "@/lib/metrics";

export default async function CouncillorInbox() {
  const session = await auth();
  if (!session || session.user.role !== "COUNCILLOR" || !session.user.councillorId) {
    redirect("/dashboard");
  }

  const [submissions, stats] = await Promise.all([
    prisma.submission.findMany({
      where: { councillorId: session.user.councillorId },
      include: { citizen: true, team: true },
      orderBy: { createdAt: "desc" },
    }),
    getCouncillorAccountability(session.user.councillorId),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Inbox</h1>
        <Link href="/dashboard/councillor/profile" className="text-sm font-medium text-slate-700 underline">
          Manage my profile
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <MiniStat label="Total" value={stats.total} />
        <MiniStat label="Resolved" value={stats.resolvedCount} />
        <MiniStat
          label="Responsiveness"
          value={stats.responsivenessScore !== null ? `${stats.responsivenessScore}%` : "—"}
        />
      </div>

      {submissions.length === 0 ? (
        <p className="mt-6 text-slate-600">No submissions yet.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {submissions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/dashboard/councillor/${s.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-400"
              >
                <div>
                  <p className="font-medium text-slate-900">{s.subject}</p>
                  <p className="text-sm text-slate-500">
                    {CATEGORY_LABELS[s.category]} &middot; {TOPIC_LABELS[s.topic]} &middot; from{" "}
                    {s.citizen.name}
                    {s.team && <> &middot; with {s.team.name}</>}
                    {s.sensitivity === "SENSITIVE" && (
                      <span className="ml-2 font-medium text-amber-600">Sensitive</span>
                    )}
                  </p>
                </div>
                <StatusBadge status={s.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
      <p className="text-xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
