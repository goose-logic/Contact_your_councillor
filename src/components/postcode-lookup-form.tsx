"use client";

import { useActionState } from "react";
import { lookupAddress } from "@/lib/actions/lookup";

export function PostcodeLookupForm() {
  const [state, action, pending] = useActionState(lookupAddress, undefined);

  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex-1">
        <label htmlFor="postcode" className="sr-only">
          Postcode
        </label>
        <input
          id="postcode"
          name="postcode"
          placeholder="e.g. E8 3DL"
          className="w-full rounded-md border border-slate-300 px-4 py-3 text-base shadow-sm focus:border-slate-500 focus:outline-none"
          autoComplete="postal-code"
        />
        {state?.message && <p className="mt-2 text-sm text-red-600">{state.message}</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-6 py-3 font-medium text-white hover:bg-slate-700 disabled:opacity-60"
      >
        {pending ? "Looking up..." : "Find my councillor"}
      </button>
    </form>
  );
}
