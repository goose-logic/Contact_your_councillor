import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { CATEGORY_LABELS } from "@/lib/labels";

export default async function CitizenDashboard() {
  const session = await auth();
  if (!session || session.user.role !== "CITIZEN") redirect("/dashboard");

  const submissions = await prisma.submission.findMany({
    where: { citizenId: session.user.id },
    include: { councillor: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">My submissions</h1>

      {submissions.length === 0 ? (
        <p className="mt-4 text-slate-600">
          You haven&apos;t contacted your councillor yet.{" "}
          <Link href="/" className="font-medium text-slate-900 underline">
            Find your councillor
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {submissions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/dashboard/citizen/${s.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-400"
              >
                <div>
                  <p className="font-medium text-slate-900">{s.subject}</p>
                  <p className="text-sm text-slate-500">
                    {CATEGORY_LABELS[s.category]} &middot; to {s.councillor.user.name}
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
