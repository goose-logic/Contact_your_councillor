import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Sign up</h1>
      <p className="mt-1 text-sm text-slate-600">
        Create a resident account to contact your councillor and track your submissions.
      </p>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <SignupForm />
      </div>
      <p className="mt-4 text-sm text-slate-600">
        Already have an account? <a className="font-medium text-slate-900 underline" href="/login">Log in</a>
      </p>
    </div>
  );
}
