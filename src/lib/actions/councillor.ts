"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function requireCouncillorId(): Promise<string> {
  const session = await auth();
  if (!session || session.user.role !== "COUNCILLOR" || !session.user.councillorId) {
    redirect("/dashboard");
  }
  return session.user.councillorId;
}

export async function updateBio(formData: FormData) {
  const councillorId = await requireCouncillorId();
  const bio = String(formData.get("bio") ?? "").trim();
  if (!bio) return;

  await prisma.councillor.update({
    where: { id: councillorId },
    data: { bio },
  });

  revalidatePath("/dashboard/councillor/profile");
  revalidatePath(`/councillors/${councillorId}`);
}

export async function createPost(formData: FormData) {
  const councillorId = await requireCouncillorId();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return;

  await prisma.post.create({
    data: { councillorId, title, body },
  });

  revalidatePath("/dashboard/councillor/profile");
  revalidatePath(`/councillors/${councillorId}`);
}
