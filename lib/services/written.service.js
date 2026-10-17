import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api/errors";

// ---- admin CRUD ----

export function listWrittenForAdmin() {
  return prisma.writtenExam.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { nameBn: true, nameEn: true } },
      _count: { select: { questions: true, attempts: true } },
    },
  });
}

export function getWrittenForAdmin(id) {
  return prisma.writtenExam.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
}

export async function createWrittenExam(data) {
  return prisma.writtenExam.create({
    data: {
      titleEn: data.titleEn,
      titleBn: data.titleBn || null,
      descriptionBn: data.descriptionBn || null,
      categoryId: data.categoryId || null,
      durationMinutes: data.durationMinutes,
      uploadWindowMinutes: data.uploadWindowMinutes ?? 10,
      totalMarks: 0,
      startAt: data.startAt ? new Date(data.startAt) : null,
      endAt: data.endAt ? new Date(data.endAt) : null,
      showModelAnswer: data.showModelAnswer ?? true,
      status: "DRAFT",
    },
  });
}

export async function updateWrittenExam(id, data) {
  return prisma.writtenExam.update({
    where: { id },
    data: {
      ...(data.titleEn !== undefined && { titleEn: data.titleEn }),
      ...(data.titleBn !== undefined && { titleBn: data.titleBn || null }),
      ...(data.descriptionBn !== undefined && { descriptionBn: data.descriptionBn || null }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId || null }),
      ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
      ...(data.uploadWindowMinutes !== undefined && { uploadWindowMinutes: data.uploadWindowMinutes }),
      ...(data.startAt !== undefined && { startAt: data.startAt ? new Date(data.startAt) : null }),
      ...(data.endAt !== undefined && { endAt: data.endAt ? new Date(data.endAt) : null }),
      ...(data.showModelAnswer !== undefined && { showModelAnswer: data.showModelAnswer }),
      ...(data.status !== undefined && { status: data.status }),
    },
  });
}

export function deleteWrittenExam(id) {
  return prisma.writtenExam.delete({ where: { id } });
}

// Replace all questions of a written exam and recompute total marks.
export async function setWrittenQuestions(writtenExamId, questions) {
  return prisma.$transaction(async (tx) => {
    await tx.writtenQuestion.deleteMany({ where: { writtenExamId } });
    let total = 0;
    for (const [i, q] of questions.entries()) {
      total += Number(q.marks) || 0;
      await tx.writtenQuestion.create({
        data: {
          writtenExamId,
          order: i,
          promptBn: q.promptBn,
          promptEn: q.promptEn || null,
          modelAnswerBn: q.modelAnswerBn || null,
          modelAnswerEn: q.modelAnswerEn || null,
          marks: Number(q.marks) || 0,
        },
      });
    }
    return tx.writtenExam.update({ where: { id: writtenExamId }, data: { totalMarks: total } });
  });
}

export async function publishWritten(id) {
  const exam = await prisma.writtenExam.findUnique({
    where: { id },
    include: { _count: { select: { questions: true } } },
  });
  if (!exam) throw new ApiError("Written exam not found", 404);
  if (exam._count.questions === 0) throw new ApiError("Add questions before publishing", 409);
  return prisma.writtenExam.update({ where: { id }, data: { status: "PUBLISHED" } });
}

// ---- student side ----

export function listWrittenForStudent() {
  return prisma.writtenExam.findMany({
    where: { status: { in: ["PUBLISHED", "ONGOING", "COMPLETED"] } },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true } } },
  });
}

// Question prompts for taking the exam (model answers withheld until submit).
export async function getWrittenForTaking(id, userId) {
  const exam = await prisma.writtenExam.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!exam || exam.status === "DRAFT") throw new ApiError("Written exam not found", 404);

  const existing = await prisma.writtenAttempt.findUnique({
    where: { writtenExamId_userId: { writtenExamId: id, userId } },
    select: { id: true },
  });

  return {
    id: exam.id,
    titleBn: exam.titleBn,
    titleEn: exam.titleEn,
    descriptionBn: exam.descriptionBn,
    durationMinutes: exam.durationMinutes,
    uploadWindowMinutes: exam.uploadWindowMinutes,
    totalMarks: Number(exam.totalMarks),
    alreadySubmitted: !!existing,
    attemptId: existing?.id ?? null,
    questions: exam.questions.map((q) => ({
      id: q.id,
      order: q.order,
      promptBn: q.promptBn,
      promptEn: q.promptEn,
      marks: Number(q.marks),
    })),
  };
}

export async function submitWritten(writtenExamId, userId, answers) {
  const exam = await prisma.writtenExam.findUnique({
    where: { id: writtenExamId },
    include: { questions: { select: { id: true } } },
  });
  if (!exam || exam.status === "DRAFT") throw new ApiError("Written exam not found", 404);

  const existing = await prisma.writtenAttempt.findUnique({
    where: { writtenExamId_userId: { writtenExamId, userId } },
    select: { id: true },
  });
  if (existing) throw new ApiError("আপনি ইতিমধ্যে জমা দিয়েছেন (already submitted)", 409);

  const validIds = new Set(exam.questions.map((q) => q.id));
  const rows = (answers ?? []).filter((a) => validIds.has(a.writtenQuestionId));

  const attempt = await prisma.writtenAttempt.create({
    data: {
      writtenExamId,
      userId,
      status: "SUBMITTED",
      answers: {
        create: rows.map((a) => ({
          writtenQuestionId: a.writtenQuestionId,
          answerText: a.answerText || null,
          fileUrl: a.fileUrl || null,
        })),
      },
    },
  });

  return { attemptId: attempt.id };
}

// Result view: student's answers alongside the model answers (if enabled).
export async function getWrittenResult(attemptId, userId, { asEvaluator = false } = {}) {
  const attempt = await prisma.writtenAttempt.findUnique({
    where: { id: attemptId },
    include: {
      writtenExam: { include: { questions: { orderBy: { order: "asc" } } } },
      answers: true,
      user: { select: { id: true, name: true, nameBn: true, email: true } },
    },
  });
  if (!attempt) throw new ApiError("Attempt not found", 404);
  if (!asEvaluator && attempt.userId !== userId) throw new ApiError("Attempt not found", 404);

  const answerMap = new Map(attempt.answers.map((a) => [a.writtenQuestionId, a]));
  const showModel = attempt.writtenExam.showModelAnswer || asEvaluator;

  return {
    attemptId: attempt.id,
    status: attempt.status,
    student: attempt.user,
    totalAwarded: attempt.totalAwarded != null ? Number(attempt.totalAwarded) : null,
    feedback: attempt.feedback,
    exam: {
      titleBn: attempt.writtenExam.titleBn,
      titleEn: attempt.writtenExam.titleEn,
      totalMarks: Number(attempt.writtenExam.totalMarks),
    },
    questions: attempt.writtenExam.questions.map((q) => {
      const ans = answerMap.get(q.id);
      return {
        id: q.id,
        order: q.order,
        promptBn: q.promptBn,
        promptEn: q.promptEn,
        marks: Number(q.marks),
        modelAnswerBn: showModel ? q.modelAnswerBn : null,
        modelAnswerEn: showModel ? q.modelAnswerEn : null,
        answerText: ans?.answerText ?? null,
        fileUrl: ans?.fileUrl ?? null,
        voiceUrl: ans?.voiceUrl ?? null,
        annotatedFileUrl: ans?.annotatedFileUrl ?? null,
        marksAwarded: ans?.marksAwarded != null ? Number(ans.marksAwarded) : null,
        evaluatorNote: ans?.evaluatorNote ?? null,
        answerId: ans?.id ?? null,
      };
    }),
  };
}

// ---- evaluator workflow ----

export function listWrittenSubmissions(writtenExamId) {
  return prisma.writtenAttempt.findMany({
    where: { writtenExamId },
    orderBy: { submittedAt: "asc" },
    include: { user: { select: { name: true, nameBn: true, email: true } } },
  });
}

export async function evaluateWritten(attemptId, evaluatorId, { marks, feedback }) {
  // marks: [{ answerId, marksAwarded, evaluatorNote }]
  let total = 0;
  await prisma.$transaction(async (tx) => {
    for (const m of marks ?? []) {
      total += Number(m.marksAwarded) || 0;
      await tx.writtenAnswer.update({
        where: { id: m.answerId },
        data: {
          marksAwarded: Number(m.marksAwarded) || 0,
          evaluatorNote: m.evaluatorNote || null,
          ...(m.voiceUrl !== undefined && { voiceUrl: m.voiceUrl || null }),
        },
      });
    }
    await tx.writtenAttempt.update({
      where: { id: attemptId },
      data: {
        status: "EVALUATED",
        totalAwarded: total,
        feedback: feedback || null,
        evaluatedById: evaluatorId,
        evaluatedAt: new Date(),
      },
    });
  });
  return { totalAwarded: total };
}
