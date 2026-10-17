import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeContentHash } from "@/lib/services/content-hash";
import { ApiError } from "@/lib/api/errors";

const QUESTION_BUCKET = "question-images";
const SIGNED_URL_TTL = 60 * 60;

// Batch-sign storage paths → { path: signedUrl }. Skips nulls/dupes.
// Values that are already full http(s) URLs (uploaded via the file manager /
// pasted in import) pass through unchanged.
export async function signPaths(paths) {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return {};
  const out = {};
  const toSign = [];
  for (const p of unique) {
    if (/^https?:\/\//.test(p)) out[p] = p;
    else toSign.push(p);
  }
  if (toSign.length) {
    const supabase = createAdminClient();
    await Promise.all(
      toSign.map(async (p) => {
        const { data } = await supabase.storage.from(QUESTION_BUCKET).createSignedUrl(p, SIGNED_URL_TTL);
        if (data?.signedUrl) out[p] = data.signedUrl;
      })
    );
  }
  return out;
}

// ---- Admin listing ----

export async function listQuestions({ subjectId, topicId, difficulty, status, search, skip, take }) {
  const where = {
    ...(subjectId && { subjectId }),
    ...(topicId && { topicId }),
    ...(difficulty && { difficulty }),
    ...(status && { status }),
    ...(search && { textBn: { contains: search, mode: "insensitive" } }),
  };

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        options: { orderBy: { order: "asc" } },
        subject: { select: { nameEn: true, nameBn: true } },
        topic: { select: { nameEn: true, nameBn: true } },
      },
    }),
    prisma.question.count({ where }),
  ]);

  const paths = questions.flatMap((q) => [q.imagePath, ...q.options.map((o) => o.imagePath)]);
  const urls = await signPaths(paths);
  const withUrls = questions.map((q) => ({
    ...q,
    imageUrl: q.imagePath ? urls[q.imagePath] ?? null : null,
    options: q.options.map((o) => ({ ...o, imageUrl: o.imagePath ? urls[o.imagePath] ?? null : null })),
  }));

  return { questions: withUrls, total };
}

// ---- Create / update (with option normalization + dedup) ----

export async function createQuestion(input, createdById) {
  const { options, ...q } = input;
  const contentHash = computeContentHash(q.textBn, options.map((o) => o.textBn));

  const dupe = await prisma.question.findUnique({ where: { contentHash }, select: { id: true } });
  if (dupe) throw new ApiError("A question with identical text and options already exists", 409);

  return prisma.question.create({
    data: {
      ...q,
      contentHash,
      createdById,
      options: {
        create: options.map((o, i) => ({
          order: i,
          textBn: o.textBn ?? "",
          textEn: o.textEn ?? null,
          imagePath: o.imagePath ?? null,
          isCorrect: !!o.isCorrect,
        })),
      },
    },
    include: { options: true },
  });
}

export async function updateQuestion(id, input) {
  const { options, ...q } = input;
  const contentHash = computeContentHash(q.textBn, options.map((o) => o.textBn));

  const clash = await prisma.question.findFirst({
    where: { contentHash, NOT: { id } },
    select: { id: true },
  });
  if (clash) throw new ApiError("Another question with identical text and options exists", 409);

  // replace options wholesale (simplest correct approach for a small option set)
  return prisma.$transaction(async (tx) => {
    await tx.questionOption.deleteMany({ where: { questionId: id } });
    return tx.question.update({
      where: { id },
      data: {
        ...q,
        contentHash,
        options: {
          create: options.map((o, i) => ({
            order: i,
            textBn: o.textBn ?? "",
            textEn: o.textEn ?? null,
            imagePath: o.imagePath ?? null,
            isCorrect: !!o.isCorrect,
          })),
        },
      },
      include: { options: true },
    });
  });
}

export function deleteQuestion(id) {
  return prisma.question.delete({ where: { id } });
}

// ---- Student practice ----
// Instant-feedback practice: we DO return isCorrect + explanation because
// practice is not graded and has no anti-cheat requirement.
export async function getPracticeQuestions({ subjectId, topicId, difficulty, limit = 20 }) {
  const questions = await prisma.question.findMany({
    where: {
      status: "ACTIVE",
      ...(subjectId && { subjectId }),
      ...(topicId && { topicId }),
      ...(difficulty && { difficulty }),
    },
    take: Math.min(100, Math.max(1, limit)),
    orderBy: { createdAt: "desc" },
    include: {
      options: { orderBy: { order: "asc" } },
      subject: { select: { nameBn: true, nameEn: true } },
    },
  });

  const paths = questions.flatMap((q) => [q.imagePath, ...q.options.map((o) => o.imagePath)]);
  const urls = await signPaths(paths);

  // light client-side shuffle of question order
  const shuffled = [...questions].sort(() => Math.random() - 0.5);

  return shuffled.map((q) => ({
    id: q.id,
    textBn: q.textBn,
    textEn: q.textEn,
    subject: q.subject,
    explanationBn: q.explanationBn,
    explanationEn: q.explanationEn,
    imageUrl: q.imagePath ? urls[q.imagePath] ?? null : null,
    options: q.options.map((o) => ({
      id: o.id,
      textBn: o.textBn,
      textEn: o.textEn,
      isCorrect: o.isCorrect,
      imageUrl: o.imagePath ? urls[o.imagePath] ?? null : null,
    })),
  }));
}
