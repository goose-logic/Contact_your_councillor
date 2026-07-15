import { prisma } from "@/lib/prisma";

const RESPONSIVE_WINDOW_DAYS = 5;

export async function getCouncillorAccountability(councillorId: string) {
  const submissions = await prisma.submission.findMany({
    where: { councillorId },
    select: {
      status: true,
      visibility: true,
      sensitivity: true,
      publishedSummary: true,
      subject: true,
      topic: true,
      createdAt: true,
      firstRespondedAt: true,
      resolvedAt: true,
    },
    orderBy: { resolvedAt: "desc" },
  });

  const total = submissions.length;
  const responded = submissions.filter((s) => s.firstRespondedAt);
  const respondedInWindow = responded.filter((s) => {
    const hours = (s.firstRespondedAt!.getTime() - s.createdAt.getTime()) / 36e5;
    return hours <= RESPONSIVE_WINDOW_DAYS * 24;
  });

  const responsivenessScore =
    total === 0 ? null : Math.round((respondedInWindow.length / total) * 100);

  const resolvedCount = submissions.filter(
    (s) => s.status === "RESOLVED" || s.status === "CLOSED"
  ).length;

  const publishedResolutions = submissions
    .filter((s) => s.visibility === "PUBLISHED" && s.publishedSummary)
    .slice(0, 10);

  return { total, resolvedCount, responsivenessScore, publishedResolutions };
}
