import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api/errors";
import { scoreAttempt } from "@/lib/services/scoring";
import { signPaths } from "@/lib/services/question.service";
import { isEnrolled, enrolledCourseIds, bustExamCache } from "@/lib/services/course.service";

// Submissions accepted up to this long after the deadline — covers latency on
// the final auto-submit, nothing more.
export const GRACE_MS = 30_000;

const now = () => new Date();

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- admin: manage a user's attempts ----

export async function listUserAttempts(userId) {
  const rows = await prisma.attempt.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: 50,
    select: {
      id: true,
      status: true,
      score: true,
      examType: true,
      isArchive: true,
      startedAt: true,
      submittedAt: true,
      exam: { select: { titleBn: true, titleEn: true, type: true, totalMarks: true } },
    },
  });
  return rows.map((a) => ({
    id: a.id,
    title: a.exam.titleBn || a.exam.titleEn,
    examType: a.exam.type,
    isArchive: a.isArchive,
    status: a.status,
    score: a.score != null ? Number(a.score) : null,
    totalMarks: Number(a.exam.totalMarks),
    startedAt: a.startedAt,
    submittedAt: a.submittedAt,
  }));
}

// Delete an attempt so the student can take the exam again (removes the
// one-live-attempt block). Answers cascade; the exam's merit list should be
// re-published afterward if it was already ranked.
export async function deleteAttempt(attemptId) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    select: { id: true },
  });
  if (!attempt) throw new ApiError("Attempt not found", 404);
  await prisma.attempt.delete({ where: { id: attemptId } });
  return { deleted: true };
}

// ---- student exam lists ----
// bucket "live"    → live exams whose window hasn't ended (upcoming + ongoing)
// bucket "archive" → ended live exams + practice exams (retake anytime)
export async function listExamsForStudent({ userId, type, bucket, categoryId, skip, take }) {
  await sweepLiveExams();
  const t = new Date();
  const where = {
    isPersonal: false,
    status: { in: ["PUBLISHED", "ONGOING", "COMPLETED"] },
    ...(type && { type }),
    ...(bucket === "live" && { type: "LIVE", endAt: { gt: t } }),
    ...(bucket === "archive" && {
      OR: [{ type: "LIVE", endAt: { lte: t } }, { type: "PRACTICE" }],
    }),
    ...(categoryId === "general" ? { categoryId: null } : categoryId ? { categoryId } : {}),
  };

  const [exams, total] = await Promise.all([
    prisma.exam.findMany({
      where,
      orderBy: [{ type: "desc" }, { startAt: "asc" }, { createdAt: "desc" }],
      skip,
      take,
      select: {
        id: true,
        type: true,
        status: true,
        titleEn: true,
        titleBn: true,
        durationMinutes: true,
        totalMarks: true,
        negativeMarking: true,
        startAt: true,
        endAt: true,
        resultPublishedAt: true,
        instantResult: true,
        courseId: true,
        course: { select: { titleBn: true, titleEn: true } },
        category: { select: { id: true, nameBn: true, nameEn: true } },
        _count: { select: { questions: true, attempts: true } },
        attempts: {
          where: { userId, isArchive: false },
          orderBy: { startedAt: "desc" },
          take: 1,
          select: { id: true, status: true, score: true, rank: true, attemptNo: true },
        },
      },
    }),
    prisma.exam.count({ where }),
  ]);

  const enrolled = await enrolledCourseIds(userId);
  return {
    exams: exams.map(({ attempts, ...e }) => ({
      ...e,
      myAttempt: attempts[0] ?? null,
      locked: !!e.courseId && !enrolled.has(e.courseId),
    })),
    total,
  };
}

// ---- start / resume ----

export async function startAttempt(examId, userId) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { question: { include: { options: true } } },
      },
    },
  });
  if (!exam || exam.status === "DRAFT" || exam.status === "ARCHIVED")
    throw new ApiError("Exam not found", 404);
  if (exam.isPersonal && exam.createdById !== userId) throw new ApiError("Exam not found", 404);
  if (exam.questions.length === 0) throw new ApiError("Exam has no questions", 409);

  if (exam.courseId && !(await isEnrolled(userId, exam.courseId)))
    throw new ApiError("এই পরীক্ষাটি শুধু কোর্সের শিক্ষার্থীদের জন্য (course enrollment required)", 403);

  const t = now();
  const isArchiveRun = exam.type === "LIVE" && t >= exam.endAt;

  if (exam.type === "LIVE" && !isArchiveRun && t < exam.startAt)
    throw new ApiError("পরীক্ষা এখনো শুরু হয়নি (live exam has not started yet)", 403);

  const existing = await prisma.attempt.findFirst({
    where: { examId, userId, status: "IN_PROGRESS" },
    select: { id: true, deadlineAt: true },
  });
  if (existing) {
    if (existing.deadlineAt.getTime() + GRACE_MS > t.getTime())
      return { attemptId: existing.id, resumed: true };
    await finalizeAttempt(existing.id, { auto: true });
  }

  if (exam.type === "LIVE" && !isArchiveRun) {
    const prior = await prisma.attempt.count({ where: { examId, userId, isArchive: false } });
    if (prior > 0)
      throw new ApiError("লাইভ পরীক্ষায় একবারই অংশ নেওয়া যায় (only one live attempt allowed)", 409);
  }

  const qIds = exam.questions.map((eq) => eq.questionId);
  const questionOrder = exam.shuffleQuestions ? shuffle(qIds) : qIds;
  const optionOrders = Object.fromEntries(
    exam.questions.map((eq) => {
      const oIds = eq.question.options.sort((a, b) => a.order - b.order).map((o) => o.id);
      return [eq.questionId, exam.shuffleOptions ? shuffle(oIds) : oIds];
    })
  );

  const durationMs = exam.durationMinutes * 60_000;
  const deadlineAt =
    exam.type === "LIVE" && !isArchiveRun
      ? new Date(Math.min(t.getTime() + durationMs, exam.endAt.getTime()))
      : new Date(t.getTime() + durationMs);

  const attemptNo =
    exam.type === "LIVE" && !isArchiveRun
      ? 1
      : (await prisma.attempt.count({ where: { examId, userId } })) + 1;

  try {
    const attempt = await prisma.attempt.create({
      data: {
        examId,
        userId,
        examType: isArchiveRun ? "PRACTICE" : exam.type,
        isArchive: isArchiveRun,
        attemptNo,
        questionOrder,
        optionOrders,
        deadlineAt,
      },
    });
    return { attemptId: attempt.id, resumed: false, isArchive: isArchiveRun };
  } catch (e) {
    if (e?.code === "P2002")
      throw new ApiError("লাইভ পরীক্ষায় একবারই অংশ নেওয়া যায় (only one live attempt allowed)", 409);
    throw e;
  }
}

// ---- attempt state (exam room) ----

async function loadAttempt(attemptId, userId) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { exam: true },
  });
  if (!attempt || attempt.userId !== userId) throw new ApiError("Attempt not found", 404);
  return attempt;
}

export async function getAttemptState(attemptId, userId) {
  let attempt = await loadAttempt(attemptId, userId);

  if (attempt.status === "IN_PROGRESS" && now().getTime() > attempt.deadlineAt.getTime() + GRACE_MS) {
    await finalizeAttempt(attempt.id, { auto: true });
    attempt = await loadAttempt(attemptId, userId);
  }

  if (attempt.status !== "IN_PROGRESS") {
    return { attempt: publicAttempt(attempt), questions: null, answers: null };
  }

  const examQuestions = await prisma.examQuestion.findMany({
    where: { examId: attempt.examId },
    include: {
      question: {
        include: { options: true, subject: { select: { id: true, nameBn: true, nameEn: true } } },
      },
    },
  });
  const byId = new Map(examQuestions.map((eq) => [eq.questionId, eq]));

  const paths = examQuestions.flatMap((eq) => [
    eq.question.imagePath,
    ...eq.question.options.map((o) => o.imagePath),
  ]);
  const urls = await signPaths(paths);

  const questions = attempt.questionOrder.map((qid, idx) => {
    const eq = byId.get(qid);
    const q = eq.question;
    const optById = new Map(q.options.map((o) => [o.id, o]));
    return {
      index: idx,
      id: q.id,
      marks: Number(eq.marks),
      textBn: q.textBn,
      textEn: q.textEn,
      subject: q.subject,
      imageUrl: q.imagePath ? urls[q.imagePath] ?? null : null,
      options: attempt.optionOrders[qid].map((oid) => {
        const o = optById.get(oid);
        return {
          id: o.id,
          textBn: o.textBn,
          textEn: o.textEn,
          imageUrl: o.imagePath ? urls[o.imagePath] ?? null : null,
        };
      }),
    };
  });

  const saved = await prisma.attemptAnswer.findMany({
    where: { attemptId },
    select: { questionId: true, selectedOptionId: true, markedForReview: true },
  });

  return { attempt: publicAttempt(attempt), questions, answers: saved };
}

function publicAttempt(a) {
  return {
    id: a.id,
    examId: a.examId,
    examType: a.examType,
    status: a.status,
    startedAt: a.startedAt,
    deadlineAt: a.deadlineAt,
    submittedAt: a.submittedAt,
    exam: {
      titleEn: a.exam.titleEn,
      titleBn: a.exam.titleBn,
      durationMinutes: a.exam.durationMinutes,
      totalMarks: Number(a.exam.totalMarks),
      negativeMarking: Number(a.exam.negativeMarking),
      resultPublishedAt: a.exam.resultPublishedAt,
      endAt: a.exam.endAt,
    },
  };
}

// ---- saving answers ----

function assertOpen(attempt) {
  if (attempt.status !== "IN_PROGRESS")
    throw new ApiError("পরীক্ষাটি জমা হয়ে গেছে (attempt already submitted)", 409);
  if (now().getTime() > attempt.deadlineAt.getTime() + GRACE_MS)
    throw new ApiError("সময় শেষ (time is up)", 409);
}

export async function saveAnswer(attemptId, userId, { questionId, selectedOptionId }) {
  const attempt = await loadAttempt(attemptId, userId);
  assertOpen(attempt);

  if (!attempt.questionOrder.includes(questionId))
    throw new ApiError("Question is not part of this attempt", 400);
  if (selectedOptionId && !attempt.optionOrders[questionId]?.includes(selectedOptionId))
    throw new ApiError("Option does not belong to this question", 400);

  // Answers lock once chosen (Alokbortika-style): a question already answered
  // cannot be changed, enforced server-side, not just in the UI.
  const existing = await prisma.attemptAnswer.findUnique({
    where: { attemptId_questionId: { attemptId, questionId } },
    select: { selectedOptionId: true },
  });
  if (existing?.selectedOptionId)
    throw new ApiError("উত্তর দেওয়ার পর পরিবর্তন করা যাবে না (answer is locked)", 409);

  await prisma.attemptAnswer.upsert({
    where: { attemptId_questionId: { attemptId, questionId } },
    update: { selectedOptionId },
    create: { attemptId, questionId, selectedOptionId },
  });
  return { saved: true };
}

export async function recordTabSwitch(attemptId, userId) {
  const attempt = await loadAttempt(attemptId, userId);
  if (attempt.status !== "IN_PROGRESS") return { recorded: false };
  await prisma.attempt.update({
    where: { id: attemptId },
    data: { tabSwitchCount: { increment: 1 } },
  });
  return { recorded: true };
}

// ---- submit + scoring ----

export async function submitAttempt(attemptId, userId) {
  const attempt = await loadAttempt(attemptId, userId);
  if (attempt.status !== "IN_PROGRESS")
    throw new ApiError("পরীক্ষাটি আগেই জমা হয়েছে (already submitted)", 409);
  const late = now().getTime() > attempt.deadlineAt.getTime() + GRACE_MS;
  await finalizeAttempt(attemptId, { auto: late });
  return getSubmittedSummary(attemptId, userId);
}

// Scores the attempt server-side. Never trusts the client.
export async function finalizeAttempt(attemptId, { auto = false } = {}) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { exam: true },
  });
  if (!attempt || attempt.status !== "IN_PROGRESS") return;

  const [examQuestions, savedAnswers] = await Promise.all([
    prisma.examQuestion.findMany({
      where: { examId: attempt.examId },
      include: {
        question: { select: { subjectId: true, options: { select: { id: true, isCorrect: true } } } },
      },
    }),
    prisma.attemptAnswer.findMany({
      where: { attemptId },
      select: { questionId: true, selectedOptionId: true },
    }),
  ]);

  const result = scoreAttempt({
    questions: examQuestions.map((eq) => ({
      id: eq.questionId,
      marks: Number(eq.marks),
      subjectId: eq.question.subjectId,
      correctOptionId: eq.question.options.find((o) => o.isCorrect)?.id ?? null,
    })),
    answers: savedAnswers,
    negativeMarking: attempt.exam.negativeMarking,
  });

  const submittedAt = new Date(Math.min(now().getTime(), attempt.deadlineAt.getTime()));
  const timeTakenSeconds = Math.max(
    0,
    Math.round((submittedAt.getTime() - attempt.startedAt.getTime()) / 1000)
  );

  await prisma.$transaction([
    ...result.perQuestion
      .filter((p) => p.selectedOptionId != null)
      .map((p) =>
        prisma.attemptAnswer.update({
          where: { attemptId_questionId: { attemptId, questionId: p.questionId } },
          data: { isCorrect: p.isCorrect },
        })
      ),
    prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: auto ? "AUTO_SUBMITTED" : "SUBMITTED",
        submittedAt,
        timeTakenSeconds,
        score: result.score,
        correctCount: result.correctCount,
        wrongCount: result.wrongCount,
        skippedCount: result.skippedCount,
        negativeMarks: result.negativeMarks,
        subjectBreakdown: result.subjectBreakdown,
      },
    }),
  ]);
}

async function getSubmittedSummary(attemptId, userId) {
  const attempt = await loadAttempt(attemptId, userId);
  if (attempt.examType === "LIVE" && !attempt.exam.resultPublishedAt && !attempt.exam.instantResult) {
    return {
      status: attempt.status,
      resultAvailable: false,
      message: "ফলাফল প্রকাশিত হলে দেখা যাবে (results appear when the merit list is published)",
    };
  }
  return { status: attempt.status, resultAvailable: true, result: resultOf(attempt) };
}

function resultOf(a) {
  return {
    isArchive: a.isArchive,
    score: Number(a.score),
    totalMarks: Number(a.exam.totalMarks),
    passMark: Number(a.exam.passMark),
    passed: Number(a.score) >= Number(a.exam.passMark),
    correctCount: a.correctCount,
    wrongCount: a.wrongCount,
    skippedCount: a.skippedCount,
    negativeMarks: Number(a.negativeMarks),
    timeTakenSeconds: a.timeTakenSeconds,
    rank: a.rank,
    subjectBreakdown: a.subjectBreakdown,
    submittedAt: a.submittedAt,
    tabSwitchCount: a.tabSwitchCount,
  };
}

// ---- result + full review ----

export async function getAttemptResult(attemptId, userId) {
  await sweepLiveExams();
  let attempt = await loadAttempt(attemptId, userId);

  if (attempt.status === "IN_PROGRESS") {
    if (now().getTime() > attempt.deadlineAt.getTime() + GRACE_MS) {
      await finalizeAttempt(attemptId, { auto: true });
      attempt = await loadAttempt(attemptId, userId);
    } else {
      throw new ApiError("পরীক্ষা এখনো চলছে (attempt still in progress)", 409);
    }
  }

  if (attempt.examType === "LIVE" && !attempt.exam.resultPublishedAt && !attempt.exam.instantResult)
    throw new ApiError("ফলাফল এখনো প্রকাশিত হয়নি (results not published yet)", 403);

  const [examQuestions, savedAnswers, myBookmarks] = await Promise.all([
    prisma.examQuestion.findMany({
      where: { examId: attempt.examId },
      include: {
        question: {
          include: { options: true, subject: { select: { id: true, nameBn: true, nameEn: true } } },
        },
      },
    }),
    prisma.attemptAnswer.findMany({ where: { attemptId } }),
    prisma.bookmark.findMany({ where: { userId }, select: { questionId: true } }),
  ]);
  const bookmarked = new Set(myBookmarks.map((b) => b.questionId));
  const answerMap = new Map(savedAnswers.map((a) => [a.questionId, a]));
  const byId = new Map(examQuestions.map((eq) => [eq.questionId, eq]));

  const paths = examQuestions.flatMap((eq) => [
    eq.question.imagePath,
    ...eq.question.options.map((o) => o.imagePath),
  ]);
  const urls = await signPaths(paths);

  const review = attempt.questionOrder.map((qid, idx) => {
    const q = byId.get(qid).question;
    const saved = answerMap.get(qid);
    const optById = new Map(q.options.map((o) => [o.id, o]));
    return {
      index: idx,
      id: q.id,
      textBn: q.textBn,
      textEn: q.textEn,
      imageUrl: q.imagePath ? urls[q.imagePath] ?? null : null,
      subject: q.subject,
      explanationBn: q.explanationBn,
      explanationEn: q.explanationEn,
      bookmarked: bookmarked.has(q.id),
      selectedOptionId: saved?.selectedOptionId ?? null,
      isCorrect: saved?.selectedOptionId ? saved.isCorrect : null,
      options: attempt.optionOrders[qid].map((oid) => {
        const o = optById.get(oid);
        return {
          id: o.id,
          textBn: o.textBn,
          textEn: o.textEn,
          imageUrl: o.imagePath ? urls[o.imagePath] ?? null : null,
          isCorrect: o.isCorrect, // safe — attempt finished & published
        };
      }),
    };
  });

  return { attempt: publicAttempt(attempt), result: resultOf(attempt), review };
}

// ---- live-exam state processing ----
// A throttled sweep runs opportunistically from hot read paths (exam list,
// results). At most once per minute per instance; a PM2 cron acts as fallback.
let lastSweepAt = 0;
export async function sweepLiveExams() {
  if (Date.now() - lastSweepAt < 60_000) return;
  lastSweepAt = Date.now();
  try {
    const out = await processLiveExams();
    if (out.resultsPublished.length > 0) {
      const { publishResults } = await import("@/lib/services/exam.service");
      for (const examId of out.resultsPublished) await publishResults(examId);
    }
  } catch (err) {
    console.error("[sweepLiveExams]", err);
  }
}

export async function processLiveExams() {
  const t = now();
  const out = { started: 0, completed: 0, autoSubmitted: 0, resultsPublished: [] };

  const starting = await prisma.exam.findMany({
    where: { type: "LIVE", status: "PUBLISHED", startAt: { lte: t } },
    select: { id: true, titleBn: true, titleEn: true, courseId: true },
  });
  if (starting.length > 0) {
    await prisma.exam.updateMany({
      where: { id: { in: starting.map((e) => e.id) } },
      data: { status: "ONGOING" },
    });
    bustExamCache();
    const { notifyAllStudents, notifyCourseStudents } = await import(
      "@/lib/services/notification.service"
    );
    for (const e of starting) {
      const payload = {
        type: "EXAM_REMINDER",
        title: `লাইভ পরীক্ষা শুরু হয়েছে — ${e.titleBn || e.titleEn}`,
        body: "এখনই অংশ নিন — সময় সীমিত!",
        link: "/exams",
      };
      await (e.courseId
        ? notifyCourseStudents(e.courseId, payload)
        : notifyAllStudents(payload)
      ).catch(() => {});
    }
  }
  out.started = starting.length;

  const ending = await prisma.exam.findMany({
    where: { type: "LIVE", status: "ONGOING", endAt: { lte: t } },
    select: { id: true, autoPublishResults: true },
  });

  for (const exam of ending) {
    const stragglers = await prisma.attempt.findMany({
      where: { examId: exam.id, status: "IN_PROGRESS" },
      select: { id: true },
    });
    for (const a of stragglers) {
      await finalizeAttempt(a.id, { auto: true });
      out.autoSubmitted++;
    }
    await prisma.exam.update({ where: { id: exam.id }, data: { status: "COMPLETED" } });
    bustExamCache();
    out.completed++;
    if (exam.autoPublishResults) out.resultsPublished.push(exam.id);
  }

  return out;
}
