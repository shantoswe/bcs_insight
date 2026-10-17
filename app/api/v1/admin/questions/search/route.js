import { withAdmin } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

// Lightweight question search for the exam builder (add questions to an exam).
export const GET = withAdmin(async (request) => {
  const p = new URL(request.url).searchParams;
  const search = p.get("search")?.trim();
  const subjectId = p.get("subjectId") || undefined;
  const excludeExamId = p.get("excludeExamId") || undefined;

  let excludeIds = [];
  if (excludeExamId) {
    const rows = await prisma.examQuestion.findMany({
      where: { examId: excludeExamId },
      select: { questionId: true },
    });
    excludeIds = rows.map((r) => r.questionId);
  }

  const questions = await prisma.question.findMany({
    where: {
      status: "ACTIVE",
      ...(subjectId && { subjectId }),
      ...(search && { textBn: { contains: search, mode: "insensitive" } }),
      ...(excludeIds.length && { id: { notIn: excludeIds } }),
    },
    take: 25,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      textBn: true,
      difficulty: true,
      subject: { select: { nameBn: true } },
      _count: { select: { options: true } },
    },
  });
  return ok(questions);
});
