import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { Timeline } from "@/components/timeline";
import { CATEGORY_LABELS, STATUS_LABELS, TOPIC_LABELS } from "@/lib/labels";
import {
  addSubmissionUpdate,
  forwardToTeam,
  publishResolution,
  setSubmissionStatus,
  toggleSensitivity,
} from "@/lib/actions/submissions";

export default async function CouncillorSubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "COUNCILLOR" || !session.user.councillorId) {
    redirect("/dashboard");
  }

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      citizen: true,
      team: true,
      councillor: { include: { ward: true } },
      updates: { orderBy: { createdAt: "asc" }, include: { author: true } },
    },
  });

  if (!submission || submission.councillorId !== session.user.councillorId) notFound();

  const teams = await prisma.team.findMany({
    where: { councilId: submission.councillor.ward.councilId },
    orderBy: { name: "asc" },
  });

  const addUpdate = addSubmissionUpdate.bind(null, submission.id);
  const forward = forwardToTeam.bind(null, submission.id);
  const changeStatus = setSubmissionStatus.bind(null, submission.id);
  const publish = publishResolution.bind(null, submission.id);
  const toggleSensitive = toggleSensitivity.bind(null, submission.id);

  const canPublish =
    (submission.status === "RESOLVED" || submission.status === "CLOSED") &&
    submission.sensitivity === "NORMAL";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{submission.subject}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {CATEGORY_LABELS[submission.category]} &middot; {TOPIC_LABELS[submission.topic]} &middot; from{" "}
            {submission.citizen.name}
          </p>
        </div>
        <StatusBadge status={submission.status} />
      </div>

      <p className="mt-4 whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-4 text-slate-800">
        {submission.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <form action={toggleSensitive}>
          <button
            type="submit"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {submission.sensitivity === "SENSITIVE" ? "Unmark as sensitive" : "Mark as sensitive"}
          </button>
        </form>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <form action={changeStatus} className="rounded-lg border border-slate-200 bg-white p-4">
          <label htmlFor="status" className="text-sm font-medium text-slate-700">
            Update status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={submission.status}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="mt-2 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Save status
          </button>
        </form>

        <form action={forward} className="rounded-lg border border-slate-200 bg-white p-4">
          <label htmlFor="teamId" className="text-sm font-medium text-slate-700">
            Forward to team
          </label>
          <select
            id="teamId"
            name="teamId"
            defaultValue={submission.teamId ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="" disabled>
              Choose a team
            </option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="mt-2 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Forward
          </button>
        </form>
      </section>

      {canPublish && (
        <form action={publish} className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <label htmlFor="summary" className="text-sm font-medium text-slate-700">
            {submission.visibility === "PUBLISHED"
              ? "Update public accountability summary"
              : "Share this resolution on your public profile"}
          </label>
          <textarea
            id="summary"
            name="summary"
            rows={2}
            defaultValue={submission.publishedSummary ?? ""}
            placeholder="A short, resident-friendly summary of what was resolved."
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="mt-2 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            {submission.visibility === "PUBLISHED" ? "Update" : "Publish to profile"}
          </button>
        </form>
      )}

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
