import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { CATEGORY_LABELS, TOPIC_LABELS } from "@/lib/labels";

export default async function TeamInbox() {
  const session = await auth();
  if (!session || session.user.role !== "TEAM_MEMBER" || !session.user.teamId) {
    redirect("/dashboard");
  }

  const [team, submissions] = await Promise.all([
    prisma.team.findUnique({ where: { id: session.user.teamId } }),
    prisma.submission.findMany({
      where: { teamId: session.user.teamId },
      include: { citizen: true, councillor: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">{team?.name} inbox</h1>
      <p className="mt-1 text-sm text-slate-500">Issues forwarded to your team by councillors.</p>

      {submissions.length === 0 ? (
        <p className="mt-6 text-slate-600">Nothing forwarded to your team yet.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {submissions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/dashboard/team/${s.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-400"
              >
                <div>
                  <p className="font-medium text-slate-900">{s.subject}</p>
                  <p className="text-sm text-slate-500">
                    {CATEGORY_LABELS[s.category]} &middot; {TOPIC_LABELS[s.topic]} &middot; via{" "}
                    {s.councillor.name}
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
