import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { Timeline } from "@/components/timeline";
import { CATEGORY_LABELS, STATUS_LABELS, TOPIC_LABELS } from "@/lib/labels";
import { addSubmissionUpdate, setSubmissionStatus } from "@/lib/actions/submissions";

export default async function TeamSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "TEAM_MEMBER" || !session.user.teamId) {
    redirect("/dashboard");
  }

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      citizen: true,
      councillor: true,
      updates: { orderBy: { createdAt: "asc" }, include: { author: true } },
    },
  });

  if (!submission || submission.teamId !== session.user.teamId) notFound();

  const addUpdate = addSubmissionUpdate.bind(null, submission.id);
  const changeStatus = setSubmissionStatus.bind(null, submission.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{submission.subject}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {CATEGORY_LABELS[submission.category]} &middot; {TOPIC_LABELS[submission.topic]} &middot; forwarded by{" "}
            {submission.councillor.name}
          </p>
        </div>
        <StatusBadge status={submission.status} />
      </div>

      <p className="mt-4 whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-4 text-slate-800">
        {submission.description}
      </p>

      <form action={changeStatus} className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <label htmlFor="status" className="text-sm font-medium text-slate-700">
          Update status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={submission.status}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:w-64"
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="mt-2 block rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          Save status
        </button>
      </form>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">Timeline</h2>
      <div className="mt-3">
        <Timeline updates={submission.updates} showVisibility />
      </div>

      <form action={addUpdate} className="mt-6 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <label htmlFor="message" className="text-sm font-medium text-slate-700">
          Add an update
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          className="rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
        />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" name="visibleToCitizen" defaultChecked />
          Visible to resident
        </label>
        <button
          type="submit"
          className="self-start rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700"
        >
          Post update
        </button>
      </form>
    </div>
  );
}
