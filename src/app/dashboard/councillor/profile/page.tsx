import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createPost, updateBio } from "@/lib/actions/councillor";

export default async function CouncillorProfileEditPage() {
  const session = await auth();
  if (!session || session.user.role !== "COUNCILLOR" || !session.user.councillorId) {
    redirect("/dashboard");
  }

  const councillor = await prisma.councillor.findUnique({
    where: { id: session.user.councillorId },
    include: { posts: { orderBy: { createdAt: "desc" } } },
  });
  if (!councillor) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">My profile</h1>

      <form action={updateBio} className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <label htmlFor="bio" className="text-sm font-medium text-slate-700">
          Bio (shown on your public profile)
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={councillor.bio ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="mt-2 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          Save bio
        </button>
      </form>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">New post</h2>
      <form action={createPost} className="mt-3 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <input
          name="title"
          placeholder="Title"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <textarea
          name="body"
          placeholder="What have you been up to?"
          rows={3}
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="self-start rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          Publish post
        </button>
      </form>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">Your posts</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {councillor.posts.map((post) => (
          <li key={post.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-medium text-slate-900">{post.title}</p>
            <p className="mt-1 text-sm text-slate-600">{post.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
