import { withAdmin } from "@/lib/api/guard";
import { ok, zodFail } from "@/lib/api/response";
import { updateLesson, deleteLesson } from "@/lib/services/course.service";
import { lessonUpdateSchema } from "@/lib/validators/course";

export const PATCH = withAdmin(async (request, { params }) => {
  const parsed = lessonUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return zodFail(parsed.error);
  const d = parsed.data;
  const lesson = await updateLesson(params.id, {
    ...(d.titleEn !== undefined && { titleEn: d.titleEn }),
    ...(d.titleBn !== undefined && { titleBn: d.titleBn || null }),
    ...(d.type !== undefined && { type: d.type }),
    ...(d.order !== undefined && { order: d.order }),
    ...(d.bunnyVideoId !== undefined && { bunnyVideoId: d.bunnyVideoId || null }),
    ...(d.videoStatus !== undefined && { videoStatus: d.videoStatus }),
    ...(d.durationSeconds !== undefined && { durationSeconds: d.durationSeconds ?? null }),
    ...(d.linkUrl !== undefined && { linkUrl: d.linkUrl || null }),
    ...(d.examId !== undefined && { examId: d.examId || null }),
    ...(d.liveScheduledAt !== undefined && {
      liveScheduledAt: d.liveScheduledAt ? new Date(d.liveScheduledAt) : null,
    }),
    ...(d.filePath !== undefined && { filePath: d.filePath || null }),
    ...(d.isFreePreview !== undefined && { isFreePreview: d.isFreePreview }),
    ...(d.isPublished !== undefined && { isPublished: d.isPublished }),
  });
  return ok(lesson);
});

export const DELETE = withAdmin(async (request, { params }) => {
  await deleteLesson(params.id);
  return ok({ deleted: true });
});
