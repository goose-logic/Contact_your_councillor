"use client";

import { useActionState } from "react";
import { signupCitizen } from "@/lib/actions/auth";

export function SignupForm() {
  const [state, action, pending] = useActionState(signupCitizen, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
        />
        {state?.errors?.name && <p className="mt-1 text-sm text-red-600">{state.errors.name[0]}</p>}
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
        />
        {state?.errors?.email && <p className="mt-1 text-sm text-red-600">{state.errors.email[0]}</p>}
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
        />
        {state?.errors?.password && (
          <p className="mt-1 text-sm text-red-600">{state.errors.password[0]}</p>
        )}
      </div>
      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-60"
      >
        {pending ? "Creating account..." : "Sign up"}
      </button>
    </form>
  );
}
