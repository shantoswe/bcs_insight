import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { signPaths } from "@/lib/services/question.service";

// List the current user's bookmarked questions ("ভুল খাতা").
export const GET = withAuth(async (request, { user }) => {
  const rows = await prisma.bookmark.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      question: {
        include: {
          options: { orderBy: { order: "asc" } },
          subject: { select: { nameBn: true, nameEn: true } },
        },
      },
    },
  });

  const paths = rows.flatMap((b) => [b.question.imagePath, ...b.question.options.map((o) => o.imagePath)]);
  const urls = await signPaths(paths);

  const data = rows.map((b) => ({
    id: b.question.id,
    textBn: b.question.textBn,
    subject: b.question.subject,
    explanationBn: b.question.explanationBn,
    imageUrl: b.question.imagePath ? urls[b.question.imagePath] ?? null : null,
    options: b.question.options.map((o) => ({
      id: o.id,
      textBn: o.textBn,
      isCorrect: o.isCorrect,
      imageUrl: o.imagePath ? urls[o.imagePath] ?? null : null,
    })),
  }));
  return ok(data);
});

// Toggle a bookmark for a question.
export const POST = withAuth(async (request, { user }) => {
  const { questionId } = await request.json();
  const existing = await prisma.bookmark.findUnique({
    where: { userId_questionId: { userId: user.id, questionId } },
    select: { id: true },
  });
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return ok({ bookmarked: false });
  }
  await prisma.bookmark.create({ data: { userId: user.id, questionId } });
  return ok({ bookmarked: true });
});
