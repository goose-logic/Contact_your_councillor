"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const CreateSubmissionSchema = z.object({
  councillorId: z.string().min(1),
  wardId: z.string().min(1),
  category: z.enum([
    "REPORT_ISSUE",
    "REQUEST_SERVICE",
    "CASEWORK_SUPPORT",
    "POLICY_FEEDBACK",
    "GENERAL_ENQUIRY",
    "COMPLAINT",
    "PRAISE_FEEDBACK",
    "MEETING_REQUEST",
  ]),
  topic: z.enum([
    "BINS_WASTE",
    "ROADS_HIGHWAYS",
    "HOUSING",
    "PARKS_ENVIRONMENT",
    "PLANNING",
    "COMMUNITY_SAFETY",
    "COUNCIL_TAX_BENEFITS",
    "EDUCATION_YOUTH",
    "OTHER",
  ]),
  subject: z.string().trim().min(3, "Give it a short subject."),
  description: z.string().trim().min(10, "Add a bit more detail."),
  sensitive: z.string().optional(),
});

export type CreateSubmissionState = { message?: string } | undefined;

export async function createSubmission(
  _prevState: CreateSubmissionState,
  formData: FormData
): Promise<CreateSubmissionState> {
  const session = await auth();
  if (!session || session.user.role !== "CITIZEN") {
    redirect("/login");
  }

  const parsed = CreateSubmissionSchema.safeParse({
    councillorId: formData.get("councillorId"),
    wardId: formData.get("wardId"),
    category: formData.get("category"),
    topic: formData.get("topic"),
    subject: formData.get("subject"),
    description: formData.get("description"),
    sensitive: formData.get("sensitive") ?? undefined,
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Please check the form and try again." };
  }

  const { councillorId, wardId, category, topic, subject, description, sensitive } = parsed.data;

  const submission = await prisma.submission.create({
    data: {
      citizenId: session.user.id,
      councillorId,
      wardId,
      category,
      topic,
      subject,
      description,
      sensitivity: sensitive === "on" ? "SENSITIVE" : "NORMAL",
    },
  });

  redirect(`/dashboard/citizen/${submission.id}`);
}

async function requireStaff() {
  const session = await auth();
  if (!session || (session.user.role !== "COUNCILLOR" && session.user.role !== "TEAM_MEMBER")) {
    redirect("/login");
  }
  return session;
}

export async function addSubmissionUpdate(submissionId: string, formData: FormData) {
  const session = await auth();
  if (!session) redirect("/login");

  const message = String(formData.get("message") ?? "").trim();
  if (!message) return;

  const visibleToCitizen =
    session.user.role === "CITIZEN" ? true : formData.get("visibleToCitizen") === "on";

  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission) return;

  await prisma.$transaction([
    prisma.submissionUpdate.create({
      data: {
        submissionId,
        authorId: session.user.id,
        authorRole: session.user.role,
        message,
        visibleToCitizen,
      },
    }),
    ...(submission.firstRespondedAt || session.user.role === "CITIZEN"
      ? []
      : [
          prisma.submission.update({
            where: { id: submissionId },
            data: { firstRespondedAt: new Date() },
          }),
        ]),
  ]);

  revalidatePath(`/dashboard/citizen/${submissionId}`);
  revalidatePath(`/dashboard/councillor/${submissionId}`);
  revalidatePath(`/dashboard/team/${submissionId}`);
}

export async function forwardToTeam(submissionId: string, formData: FormData) {
  const session = await requireStaff();
  if (session.user.role !== "COUNCILLOR") return;

  const teamId = String(formData.get("teamId") ?? "");
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return;

  await prisma.$transaction([
    prisma.submission.update({
      where: { id: submissionId },
      data: { teamId, status: "FORWARDED" },
    }),
    prisma.submissionUpdate.create({
      data: {
        submissionId,
        authorId: session.user.id,
        authorRole: session.user.role,
        message: `Forwarded to the ${team.name} team.`,
        visibleToCitizen: true,
      },
    }),
  ]);

  revalidatePath(`/dashboard/councillor/${submissionId}`);
}

const STATUS_VALUES = ["NEW", "TRIAGED", "FORWARDED", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

export async function setSubmissionStatus(submissionId: string, formData: FormData) {
  const session = await requireStaff();
  const status = String(formData.get("status") ?? "");
  if (!STATUS_VALUES.includes(status as (typeof STATUS_VALUES)[number])) return;

  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: status as (typeof STATUS_VALUES)[number],
      resolvedAt: status === "RESOLVED" || status === "CLOSED" ? new Date() : undefined,
    },
  });

  await prisma.submissionUpdate.create({
    data: {
      submissionId,
      authorId: session.user.id,
      authorRole: session.user.role,
      message: `Status changed to ${status.replace("_", " ").toLowerCase()}.`,
      visibleToCitizen: true,
    },
  });

  revalidatePath(`/dashboard/councillor/${submissionId}`);
  revalidatePath(`/dashboard/team/${submissionId}`);
  revalidatePath(`/dashboard/citizen/${submissionId}`);
}

export async function publishResolution(submissionId: string, formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "COUNCILLOR") redirect("/login");

  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission || submission.councillorId !== session.user.councillorId) return;
  if (submission.sensitivity === "SENSITIVE") return;

  const summary = String(formData.get("summary") ?? "").trim();
  if (!summary) return;

  await prisma.submission.update({
    where: { id: submissionId },
    data: { visibility: "PUBLISHED", publishedSummary: summary },
  });

  revalidatePath(`/dashboard/councillor/${submissionId}`);
  revalidatePath(`/councillors/${session.user.councillorId}`);
}

export async function toggleSensitivity(submissionId: string) {
  const session = await auth();
  if (!session || session.user.role !== "COUNCILLOR") redirect("/login");

  const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
  if (!submission || submission.councillorId !== session.user.councillorId) return;

  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      sensitivity: submission.sensitivity === "SENSITIVE" ? "NORMAL" : "SENSITIVE",
      ...(submission.sensitivity !== "SENSITIVE"
        ? { visibility: "PRIVATE", publishedSummary: null }
        : {}),
    },
  });

  revalidatePath(`/dashboard/councillor/${submissionId}`);
}
