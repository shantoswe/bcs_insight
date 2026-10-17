import { withAuth } from "@/lib/api/guard";
import { ok, fail } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { isEnrolled } from "@/lib/services/course.service";
import { signedEmbedUrl } from "@/lib/services/bunny.service";

// Returns a short-lived, enrollment-gated signed Bunny embed URL plus a
// per-viewer watermark string. The signed URL is minted per play and expires,
// so it can't be copied out and reused. A viewer only ever receives a token
// for a lesson they're allowed to watch.
export const GET = withAuth(async (request, { user, params }) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: params.id },
    select: {
      id: true, type: true, bunnyVideoId: true, isFreePreview: true,
      section: { select: { courseId: true } },
    },
  });
  if (!lesson || lesson.type !== "VIDEO" || !lesson.bunnyVideoId)
    return fail("Video not found", { status: 404 });

  const allowed = lesson.isFreePreview || (await isEnrolled(user.id, lesson.section.courseId));
  if (!allowed) return fail("এই ভিডিও দেখতে কোর্সে ভর্তি হন", { status: 403 });

  return ok({
    embedUrl: signedEmbedUrl(lesson.bunnyVideoId, { ttlSeconds: 3 * 3600 }),
    // identity overlay to deter re-recording / redistribution
    watermark: `${user.nameBn || user.name} · ${user.phone || user.email}`,
  });
});
