import { withAdmin } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { listCourseEnrollments, adminEnroll, adminUnenroll } from "@/lib/services/course.service";

export const GET = withAdmin(async (request, { params }) =>
  ok(await listCourseEnrollments(params.id))
);

// POST { userId, expiresAt? } → assign; { userId, action: "remove" } → unenroll
export const POST = withAdmin(async (request, { params }) => {
  const body = await request.json();
  if (body.action === "remove") {
    await adminUnenroll(params.id, body.userId);
    return ok({ removed: true }, { message: "সরানো হয়েছে" });
  }
  await adminEnroll(params.id, body.userId, { expiresAt: body.expiresAt });
  return ok({ enrolled: true }, { message: "শিক্ষার্থী যুক্ত হয়েছে" });
});
