import { withAdmin } from "@/lib/api/guard";
import { ok, zodFail } from "@/lib/api/response";
import { createLesson } from "@/lib/services/course.service";
import { lessonSchema } from "@/lib/validators/course";

export const POST = withAdmin(async (request) => {
  const parsed = lessonSchema.safeParse(await request.json());
  if (!parsed.success) return zodFail(parsed.error);
  const d = parsed.data;
  const lesson = await createLesson({
    sectionId: d.sectionId,
    type: d.type,
    titleEn: d.titleEn,
    titleBn: d.titleBn || null,
    order: d.order,
    bunnyVideoId: d.bunnyVideoId || null,
    videoStatus: d.bunnyVideoId ? d.videoStatus || "PROCESSING" : "NONE",
    durationSeconds: d.durationSeconds ?? null,
    linkUrl: d.linkUrl || null,
    examId: d.examId || null,
    liveScheduledAt: d.liveScheduledAt ? new Date(d.liveScheduledAt) : null,
    filePath: d.filePath || null,
    isFreePreview: d.isFreePreview,
    isPublished: d.isPublished,
  });
  return ok(lesson, { status: 201 });
});
