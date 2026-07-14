import { PostcodeLookupForm } from "@/components/postcode-lookup-form";

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900">
        Contact your councillor
      </h1>
      <p className="mt-4 text-lg text-slate-600">
        Enter your postcode to find your local councillors, see what they&apos;ve been up to, and
        get your issue in front of the right team &mdash; with updates you can actually follow.
      </p>

      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <PostcodeLookupForm />
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        <Feature
          title="Find who represents you"
          body="Real ward and council lookup, so you always reach the right councillor."
        />
        <Feature
          title="Get routed, not lost"
          body="Your message is categorized and forwarded to the council team that handles it."
        />
        <Feature
          title="Track progress"
          body="See updates as your councillor and their team work the issue, start to finish."
        />
      </div>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
    </div>
  );
}
