import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api/errors";

// ---- helpers ----

async function recomputeTotals(examId) {
  const agg = await prisma.examQuestion.aggregate({
    where: { examId },
    _sum: { marks: true },
  });
  const totalMarks = Number(agg._sum.marks ?? 0);
  await prisma.exam.update({ where: { id: examId }, data: { totalMarks } });
  return totalMarks;
}

// ---- admin CRUD ----

export function listExamsForAdmin({ type, status } = {}) {
  return prisma.exam.findMany({
    where: { isPersonal: false, ...(type && { type }), ...(status && { status }) },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { nameBn: true, nameEn: true } },
      course: { select: { titleBn: true, titleEn: true } },
      _count: { select: { questions: true, attempts: true } },
    },
  });
}

export function getExamForAdmin(id) {
  return prisma.exam.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: {
          question: {
            include: {
              options: { orderBy: { order: "asc" } },
              subject: { select: { nameBn: true, nameEn: true } },
            },
          },
        },
      },
      category: { select: { nameBn: true, nameEn: true } },
    },
  });
}

export async function createExam(data, createdById) {
  return prisma.exam.create({
    data: {
      type: data.type,
      status: "DRAFT",
      categoryId: data.categoryId || null,
      courseId: data.courseId || null,
      titleEn: data.titleEn,
      titleBn: data.titleBn || null,
      descriptionBn: data.descriptionBn || null,
      durationMinutes: data.durationMinutes,
      totalMarks: 0,
      passMark: data.passMark ?? 0,
      negativeMarking: data.negativeMarking ?? 0.25,
      shuffleQuestions: data.shuffleQuestions ?? true,
      shuffleOptions: data.shuffleOptions ?? true,
      startAt: data.startAt ? new Date(data.startAt) : null,
      endAt: data.endAt ? new Date(data.endAt) : null,
      instantResult: data.instantResult ?? false,
      autoPublishResults: data.autoPublishResults ?? true,
      createdById,
    },
  });
}

export async function updateExam(id, data) {
  return prisma.exam.update({
    where: { id },
    data: {
      ...(data.titleEn !== undefined && { titleEn: data.titleEn }),
      ...(data.titleBn !== undefined && { titleBn: data.titleBn || null }),
      ...(data.descriptionBn !== undefined && { descriptionBn: data.descriptionBn || null }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId || null }),
      ...(data.courseId !== undefined && { courseId: data.courseId || null }),
      ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
      ...(data.passMark !== undefined && { passMark: data.passMark }),
      ...(data.negativeMarking !== undefined && { negativeMarking: data.negativeMarking }),
      ...(data.shuffleQuestions !== undefined && { shuffleQuestions: data.shuffleQuestions }),
      ...(data.shuffleOptions !== undefined && { shuffleOptions: data.shuffleOptions }),
      ...(data.startAt !== undefined && { startAt: data.startAt ? new Date(data.startAt) : null }),
      ...(data.endAt !== undefined && { endAt: data.endAt ? new Date(data.endAt) : null }),
      ...(data.instantResult !== undefined && { instantResult: data.instantResult }),
      ...(data.autoPublishResults !== undefined && { autoPublishResults: data.autoPublishResults }),
    },
  });
}

export function deleteExam(id) {
  return prisma.exam.delete({ where: { id } });
}

// Student-facing exam summary for the start/intro screen.
export async function getExamForIntro(examId, userId) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: {
      id: true, type: true, status: true, titleEn: true, titleBn: true, descriptionBn: true,
      durationMinutes: true, totalMarks: true, passMark: true, negativeMarking: true,
      startAt: true, endAt: true, courseId: true, isPersonal: true,
      _count: { select: { questions: true } },
      attempts: {
        where: { userId, isArchive: false },
        orderBy: { startedAt: "desc" },
        take: 1,
        select: { id: true, status: true },
      },
    },
  });
  if (!exam || exam.status === "DRAFT" || exam.status === "ARCHIVED" || exam.isPersonal) return null;

  const now = new Date();
  const ended = exam.type === "LIVE" && exam.endAt && now >= exam.endAt;
  const notStarted = exam.type === "LIVE" && exam.startAt && now < exam.startAt;
  const inProgress = exam.attempts[0]?.status === "IN_PROGRESS";
  const done = ["SUBMITTED", "AUTO_SUBMITTED"].includes(exam.attempts[0]?.status);

  return {
    id: exam.id,
    type: exam.type,
    titleBn: exam.titleBn,
    titleEn: exam.titleEn,
    descriptionBn: exam.descriptionBn,
    questionCount: exam._count.questions,
    durationMinutes: exam.durationMinutes,
    totalMarks: Number(exam.totalMarks),
    passMark: Number(exam.passMark),
    negativeMarking: Number(exam.negativeMarking),
    startAt: exam.startAt,
    endAt: exam.endAt,
    notStarted,
    ended,
    inProgress,
    done,
    attemptId: exam.attempts[0]?.id ?? null,
  };
}

// ---- questions on an exam ----

export async function appendExamQuestions(examId, questionIds) {
  const last = await prisma.examQuestion.findFirst({
    where: { examId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  let order = (last?.order ?? -1) + 1;
  let added = 0;

  for (const questionId of questionIds) {
    try {
      await prisma.examQuestion.create({
        data: { examId, questionId, order: order++, marks: 1 },
      });
      added++;
    } catch (e) {
      if (e?.code !== "P2002") throw e; // already on the exam — skip
    }
  }
  await recomputeTotals(examId);
  return added;
}

export async function removeExamQuestion(examId, questionId) {
  await prisma.examQuestion.deleteMany({ where: { examId, questionId } });
  await recomputeTotals(examId);
}

export async function setQuestionMarks(examId, questionId, marks) {
  await prisma.examQuestion.updateMany({ where: { examId, questionId }, data: { marks } });
  await recomputeTotals(examId);
}

// ---- publish / status ----

export async function publishExam(examId) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { _count: { select: { questions: true } } },
  });
  if (!exam) throw new ApiError("Exam not found", 404);
  if (exam._count.questions === 0) throw new ApiError("Add questions before publishing", 409);
  if (exam.type === "LIVE" && (!exam.startAt || !exam.endAt))
    throw new ApiError("Live exams need a start and end time", 409);

  return prisma.exam.update({ where: { id: examId }, data: { status: "PUBLISHED" } });
}

export function unpublishExam(examId) {
  return prisma.exam.update({ where: { id: examId }, data: { status: "DRAFT" } });
}

// Publish results (merit list) for a live exam: rank by score desc, then time.
export async function publishResults(examId) {
  const attempts = await prisma.attempt.findMany({
    where: { examId, isArchive: false, status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
    orderBy: [{ score: "desc" }, { timeTakenSeconds: "asc" }],
    select: { id: true },
  });

  await prisma.$transaction([
    ...attempts.map((a, i) =>
      prisma.attempt.update({ where: { id: a.id }, data: { rank: i + 1 } })
    ),
    prisma.exam.update({
      where: { id: examId },
      data: { status: "COMPLETED", resultPublishedAt: new Date() },
    }),
  ]);

  return { ranked: attempts.length };
}

// ---- leaderboard / merit list ----

export async function getLeaderboard(examId, { limit = 100 } = {}) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: {
      id: true,
      titleBn: true,
      titleEn: true,
      totalMarks: true,
      type: true,
      resultPublishedAt: true,
      instantResult: true,
    },
  });
  if (!exam) throw new ApiError("Exam not found", 404);

  // live exams: merit list hidden until published
  if (exam.type === "LIVE" && !exam.resultPublishedAt)
    return { exam, published: false, rows: [] };

  const attempts = await prisma.attempt.findMany({
    where: { examId, isArchive: false, status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
    orderBy: [{ score: "desc" }, { timeTakenSeconds: "asc" }],
    take: limit,
    select: {
      id: true,
      score: true,
      correctCount: true,
      wrongCount: true,
      timeTakenSeconds: true,
      rank: true,
      user: { select: { id: true, name: true, nameBn: true } },
    },
  });

  return {
    exam,
    published: true,
    rows: attempts.map((a, i) => ({
      rank: a.rank ?? i + 1,
      userId: a.user.id,
      name: a.user.nameBn || a.user.name,
      score: Number(a.score),
      correctCount: a.correctCount,
      wrongCount: a.wrongCount,
      timeTakenSeconds: a.timeTakenSeconds,
    })),
  };
}
