import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api/errors";
import { isEnrolled } from "@/lib/services/course.service";

// Upsert a student's progress on a lesson (position + completion).
export async function saveLessonProgress(userId, lessonId, { lastPositionSeconds, completed }) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, isFreePreview: true, section: { select: { courseId: true } } },
  });
  if (!lesson) throw new ApiError("Lesson not found", 404);

  if (!lesson.isFreePreview && !(await isEnrolled(userId, lesson.section.courseId)))
    throw new ApiError("Enroll to track progress", 403);

  return prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: {
      ...(lastPositionSeconds != null && { lastPositionSeconds: Math.max(0, Math.floor(lastPositionSeconds)) }),
      ...(completed != null && { completed }),
    },
    create: {
      userId,
      lessonId,
      lastPositionSeconds: Math.max(0, Math.floor(lastPositionSeconds ?? 0)),
      completed: completed ?? false,
    },
  });
}

export async function courseProgressSummary(userId, courseId) {
  const [total, done] = await Promise.all([
    prisma.lesson.count({ where: { section: { courseId }, isPublished: true } }),
    prisma.lessonProgress.count({
      where: { userId, completed: true, lesson: { section: { courseId } } },
    }),
  ]);
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
}
