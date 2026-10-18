import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";
import { ApiError } from "@/lib/api/errors";

const COURSE_BUCKET = "course-assets";
const SIGNED_URL_TTL = 60 * 60;

// Small in-process cache bust hook used by the live-exam sweep.
export function bustExamCache() {
  /* no-op placeholder; kept for parity with the sweep API */
}

// ---- enrollment helpers (used by the exam engine) ----

export async function isEnrolled(userId, courseId) {
  const e = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true, expiresAt: true },
  });
  if (!e) return false;
  return !e.expiresAt || e.expiresAt > new Date();
}

export async function enrolledCourseIds(userId) {
  const rows = await prisma.enrollment.findMany({
    where: { userId },
    select: { courseId: true },
  });
  return new Set(rows.map((r) => r.courseId));
}

export async function enroll(userId, courseId) {
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
  if (!course) throw new ApiError("Course not found", 404);
  return prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {},
    create: { userId, courseId },
  });
}

// ---- admin: assign / manage students in a course ----

export function listCourseEnrollments(courseId) {
  return prisma.enrollment.findMany({
    where: { courseId },
    orderBy: { enrolledAt: "desc" },
    include: { user: { select: { id: true, name: true, nameBn: true, email: true, phone: true } } },
  });
}

// A single user's enrolled courses (for the user-management "assign course" view).
export async function listUserEnrollments(userId) {
  const rows = await prisma.enrollment.findMany({
    where: { userId },
    orderBy: { enrolledAt: "desc" },
    include: { course: { select: { id: true, titleBn: true, titleEn: true, courseType: true } } },
  });
  return rows.map((r) => ({
    courseId: r.courseId,
    enrolledAt: r.enrolledAt,
    title: r.course.titleBn || r.course.titleEn,
    courseType: r.course.courseType,
  }));
}

export async function adminEnroll(courseId, userId, { expiresAt } = {}) {
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
  if (!course) throw new ApiError("Course not found", 404);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw new ApiError("User not found", 404);
  return prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: { expiresAt: expiresAt ? new Date(expiresAt) : null },
    create: { userId, courseId, expiresAt: expiresAt ? new Date(expiresAt) : null },
  });
}

export async function adminUnenroll(courseId, userId) {
  await prisma.enrollment.deleteMany({ where: { courseId, userId } });
  return { removed: true };
}

// ---- signed thumbnails ----

async function signThumb(path) {
  if (!path) return null;
  // thumbnails uploaded via the file manager are stored as full public URLs
  if (/^https?:\/\//.test(path)) return path;
  const supabase = createAdminClient();
  const { data } = await supabase.storage.from(COURSE_BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
  return data?.signedUrl ?? null;
}

// ---- public course listing / detail ----

export async function listPublishedCourses({ type, categorySlug } = {}) {
  const courses = await prisma.course.findMany({
    where: {
      isPublished: true,
      ...(type && { courseType: type }),
      ...(categorySlug && { category: { slug: categorySlug } }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { id: true, slug: true, nameBn: true, nameEn: true } },
      _count: { select: { enrollments: true, sections: true } },
    },
  });
  return Promise.all(
    courses.map(async (c) => ({ ...c, priceBDT: Number(c.priceBDT), thumbnailUrl: await signThumb(c.thumbnailPath) }))
  );
}

export async function getCourseBySlug(slug, userId) {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      category: { select: { nameBn: true, nameEn: true } },
      sections: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            where: { isPublished: true },
            select: {
              id: true,
              type: true,
              titleBn: true,
              titleEn: true,
              order: true,
              bunnyVideoId: true,
              videoStatus: true,
              durationSeconds: true,
              isFreePreview: true,
              linkUrl: true,
              examId: true,
              liveScheduledAt: true,
              filePath: true,
            },
          },
        },
      },
    },
  });
  if (!course) return null;

  const enrolled = userId ? await isEnrolled(userId, course.id) : false;
  const progress = enrolled ? await lessonProgressMap(userId, course.id) : new Map();

  // paid-course payment status for this student (latest request, if any)
  const isPaid = !course.isFree && Number(course.priceBDT) > 0;
  let payment = null;
  if (userId && isPaid && !enrolled) {
    const { myRequestForCourse } = await import("@/lib/services/payment.service");
    payment = await myRequestForCourse(userId, course.id);
  }

  return {
    ...course,
    priceBDT: Number(course.priceBDT),
    thumbnailUrl: await signThumb(course.thumbnailPath),
    enrolled,
    payment,
    sections: course.sections.map((s) => ({
      ...s,
      lessons: s.lessons.map((l) => {
        const unlocked = enrolled || l.isFreePreview;
        return {
          ...l,
          // gate the Bunny id behind enrollment (free previews always allowed)
          bunnyVideoId: unlocked ? l.bunnyVideoId : null,
          // never ship the PDF path or resource link to a viewer without access;
          // unlocked viewers open it through /api/v1/lessons/[id]/file instead
          filePath: null,
          linkUrl: null,
          hasMaterial: unlocked && !!(l.type === "PDF" ? l.filePath : l.linkUrl),
          completed: progress.get(l.id)?.completed ?? false,
          lastPositionSeconds: progress.get(l.id)?.lastPositionSeconds ?? 0,
        };
      }),
    })),
  };
}

async function lessonProgressMap(userId, courseId) {
  const rows = await prisma.lessonProgress.findMany({
    where: { userId, lesson: { section: { courseId } } },
    select: { lessonId: true, completed: true, lastPositionSeconds: true },
  });
  return new Map(rows.map((r) => [r.lessonId, r]));
}

// ---- admin CRUD ----

export function listAllCourses() {
  return prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { sections: true, enrollments: true } } },
  });
}

export function createCourse(data) {
  return prisma.course.create({
    data: { ...data, slug: data.slug || slugify(data.titleEn) },
  });
}

export function updateCourse(id, data) {
  return prisma.course.update({ where: { id }, data });
}

export function deleteCourse(id) {
  return prisma.course.delete({ where: { id } });
}

export function getCourseForAdmin(id) {
  return prisma.course.findUnique({
    where: { id },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });
}

// ---- sections & lessons ----

export function createSection(data) {
  return prisma.courseSection.create({ data });
}
export function updateSection(id, data) {
  return prisma.courseSection.update({ where: { id }, data });
}
export function deleteSection(id) {
  return prisma.courseSection.delete({ where: { id } });
}

export function createLesson(data) {
  return prisma.lesson.create({ data });
}
export function updateLesson(id, data) {
  return prisma.lesson.update({ where: { id }, data });
}
export function deleteLesson(id) {
  return prisma.lesson.delete({ where: { id } });
}
