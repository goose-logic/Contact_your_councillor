import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Log in</h1>
      <p className="mt-1 text-sm text-slate-600">
        Citizens, councillors, and council team members all sign in here.
      </p>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <LoginForm callbackUrl={callbackUrl} />
      </div>
      <p className="mt-4 text-sm text-slate-600">
        No account? <a className="font-medium text-slate-900 underline" href="/signup">Sign up</a> as a resident.
      </p>
    </div>
  );
}
