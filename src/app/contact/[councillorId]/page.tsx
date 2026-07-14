import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ContactForm } from "@/components/contact-form";

export default async function ContactCouncillorPage({
  params,
}: {
  params: Promise<{ councillorId: string }>;
}) {
  const { councillorId } = await params;

  const councillor = await prisma.councillor.findUnique({
    where: { id: councillorId },
    include: { user: true, ward: true },
  });
  if (!councillor) notFound();

  const session = await auth();

  if (!session) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Log in to contact {councillor.user.name}
        </h1>
        <p className="mt-2 text-slate-600">
          Create a free resident account so you can track updates on your submission.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href={`/login?callbackUrl=/contact/${councillor.id}`}
            className="rounded-md border border-slate-300 px-4 py-2 font-medium text-slate-900"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-slate-900 px-4 py-2 font-medium text-white"
          >
            Sign up
          </Link>
        </div>
      </div>
    );
  }

  if (session.user.role !== "CITIZEN") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-slate-600">
        Only resident accounts can submit contact requests.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Contact {councillor.user.name}</h1>
      <p className="mt-1 text-sm text-slate-600">
        Tell us what this is about and we&apos;ll get it to the right place.
      </p>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <ContactForm councillorId={councillor.id} wardId={councillor.wardId} />
      </div>
    </div>
  );
}
