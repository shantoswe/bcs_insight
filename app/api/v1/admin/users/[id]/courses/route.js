import { withAdmin } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { listUserEnrollments, adminEnroll, adminUnenroll } from "@/lib/services/course.service";

export const GET = withAdmin(async (request, { params }) =>
  ok(await listUserEnrollments(params.id))
);

// POST { courseId, action: "assign" | "remove" }
export const POST = withAdmin(async (request, { params }) => {
  const body = await request.json();
  if (body.action === "remove") {
    await adminUnenroll(body.courseId, params.id);
    return ok({ removed: true }, { message: "কোর্স থেকে সরানো হয়েছে" });
  }
  await adminEnroll(body.courseId, params.id, { expiresAt: body.expiresAt });
  return ok({ assigned: true }, { message: "কোর্সে যুক্ত হয়েছে" });
});
