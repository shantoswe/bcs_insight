import { withAdmin } from "@/lib/api/guard";
import { ok, zodFail } from "@/lib/api/response";
import { listAllCourses, createCourse } from "@/lib/services/course.service";
import { courseSchema } from "@/lib/validators/course";

export const GET = withAdmin(async () => ok(await listAllCourses()));

export const POST = withAdmin(async (request) => {
  const parsed = courseSchema.safeParse(await request.json());
  if (!parsed.success) return zodFail(parsed.error);
  const course = await createCourse(parsed.data);
  return ok(course, { message: "কোর্স তৈরি হয়েছে", status: 201 });
});
