import { withAdmin } from "@/lib/api/guard";
import { ok, zodFail } from "@/lib/api/response";
import { getCourseForAdmin, updateCourse, deleteCourse } from "@/lib/services/course.service";
import { courseSchema } from "@/lib/validators/course";

export const GET = withAdmin(async (request, { params }) => ok(await getCourseForAdmin(params.id)));

export const PATCH = withAdmin(async (request, { params }) => {
  const parsed = courseSchema.partial().safeParse(await request.json());
  if (!parsed.success) return zodFail(parsed.error);
  const course = await updateCourse(params.id, parsed.data);
  return ok(course, { message: "হালনাগাদ হয়েছে" });
});

export const DELETE = withAdmin(async (request, { params }) => {
  await deleteCourse(params.id);
  return ok({ deleted: true });
});
