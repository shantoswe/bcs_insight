import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/guard";
import { fail } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { isEnrolled } from "@/lib/services/course.service";
import { isStaff } from "@/lib/auth/permissions";
import { signedLessonUrl } from "@/lib/storage";

// Enrollment-gated lesson material (PDF file or resource/live-class link).
// The stored path/URL is never sent to the browser with the course payload:
// a viewer only gets a short-lived redirect for a lesson they may open.
export const GET = withAuth(async (request, { user, params }) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: params.id },
    select: {
      id: true, type: true, filePath: true, linkUrl: true, isFreePreview: true, isPublished: true,
      section: { select: { courseId: true } },
    },
  });
  if (!lesson || (!lesson.isPublished && !isStaff(user))) return fail("Lesson not found", { status: 404 });

  const allowed =
    isStaff(user) || lesson.isFreePreview || (await isEnrolled(user.id, lesson.section.courseId));
  if (!allowed) return fail("এই লেসন দেখতে কোর্সে ভর্তি হন", { status: 403 });

  const target = lesson.type === "PDF" ? lesson.filePath : lesson.linkUrl;
  if (!target) return fail("File not found", { status: 404 });

  // external links (and legacy public URLs) pass through unchanged
  if (/^https?:\/\//.test(target)) return NextResponse.redirect(target);

  return NextResponse.redirect(await signedLessonUrl(target));
});
