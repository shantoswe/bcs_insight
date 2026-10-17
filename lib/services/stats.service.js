import { prisma } from "@/lib/prisma";

// Admin dashboard headline numbers.
export async function adminStats() {
  const [users, questions, exams, courses, attempts, writtenPending, paymentsPending] = await Promise.all([
    prisma.user.count(),
    prisma.question.count(),
    prisma.exam.count({ where: { isPersonal: false } }),
    prisma.course.count(),
    prisma.attempt.count({ where: { status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } } }),
    prisma.writtenAttempt.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
    prisma.paymentRequest.count({ where: { status: "PENDING" } }),
  ]);
  return { users, questions, exams, courses, attempts, writtenPending, paymentsPending };
}

// Student dashboard: attempt history + headline metrics.
export async function studentDashboard(userId) {
  const attempts = await prisma.attempt.findMany({
    where: { userId, status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
    orderBy: { submittedAt: "desc" },
    take: 20,
    select: {
      id: true,
      score: true,
      correctCount: true,
      wrongCount: true,
      skippedCount: true,
      rank: true,
      submittedAt: true,
      isArchive: true,
      exam: { select: { titleBn: true, titleEn: true, totalMarks: true, type: true } },
    },
  });

  const enrollments = await prisma.enrollment.count({ where: { userId } });
  const bookmarks = await prisma.bookmark.count({ where: { userId } });

  const totalScore = attempts.reduce((s, a) => s + Number(a.score ?? 0), 0);
  const totalMax = attempts.reduce((s, a) => s + Number(a.exam.totalMarks ?? 0), 0);
  const avgPercent = totalMax ? Math.round((totalScore / totalMax) * 100) : 0;

  return {
    examsTaken: attempts.length,
    avgPercent,
    enrollments,
    bookmarks,
    recent: attempts.map((a) => ({
      id: a.id,
      title: a.exam.titleBn || a.exam.titleEn,
      score: Number(a.score),
      total: Number(a.exam.totalMarks),
      correct: a.correctCount,
      wrong: a.wrongCount,
      rank: a.rank,
      type: a.exam.type,
      submittedAt: a.submittedAt,
    })),
  };
}
