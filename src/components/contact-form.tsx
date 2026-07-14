"use client";

import { useActionState } from "react";
import { createSubmission } from "@/lib/actions/submissions";
import { CATEGORY_LABELS, TOPIC_LABELS } from "@/lib/labels";

export function ContactForm({ councillorId, wardId }: { councillorId: string; wardId: string }) {
  const [state, action, pending] = useActionState(createSubmission, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="councillorId" value={councillorId} />
      <input type="hidden" name="wardId" value={wardId} />

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-slate-700">
          What type of contact is this?
        </label>
        <select
          id="category"
          name="category"
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
        >
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="topic" className="block text-sm font-medium text-slate-700">
          Topic
        </label>
        <select
          id="topic"
          name="topic"
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
        >
          {Object.entries(TOPIC_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-slate-700">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700">
          Details
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={5}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
        />
      </div>

      <label className="flex items-start gap-2 text-sm text-slate-600">
        <input type="checkbox" name="sensitive" className="mt-0.5" />
        This is personal or sensitive &mdash; don&apos;t include it in the councillor&apos;s
        public accountability page, even if resolved.
      </label>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-60"
      >
        {pending ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
