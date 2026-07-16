import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { Timeline } from "@/components/timeline";
import { CATEGORY_LABELS, TOPIC_LABELS } from "@/lib/labels";
import { addSubmissionUpdate } from "@/lib/actions/submissions";

export default async function CitizenSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "CITIZEN") redirect("/dashboard");

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      councillor: true,
      team: true,
      updates: {
        where: { visibleToCitizen: true },
        orderBy: { createdAt: "asc" },
        include: { author: true },
      },
    },
  });

  if (!submission || submission.citizenId !== session.user.id) notFound();

  const addUpdate = addSubmissionUpdate.bind(null, submission.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{submission.subject}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {CATEGORY_LABELS[submission.category]} &middot; {TOPIC_LABELS[submission.topic]} &middot; to{" "}
            {submission.councillor.name}
            {submission.team && <> &middot; with {submission.team.name}</>}
          </p>
        </div>
        <StatusBadge status={submission.status} />
      </div>

      <p className="mt-4 whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-4 text-slate-800">
        {submission.description}
      </p>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">Updates</h2>
      <div className="mt-3">
        <Timeline updates={submission.updates} />
      </div>

      <form action={addUpdate} className="mt-6 flex flex-col gap-3">
        <label htmlFor="message" className="text-sm font-medium text-slate-700">
          Add a reply
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          className="self-start rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700"
        >
          Send reply
        </button>
      </form>
    </div>
  );
}
