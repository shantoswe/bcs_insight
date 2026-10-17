import { z } from "zod";
import { withAdmin } from "@/lib/api/guard";
import { ok, zodFail } from "@/lib/api/response";
import { notifyAllStudents, notifyCourseStudents } from "@/lib/services/notification.service";

const schema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(2000).nullish(),
  link: z.string().trim().max(500).nullish(),
  courseId: z.string().nullish(), // null → everyone
});

// Admin announcement to all students or one course's students.
export const POST = withAdmin(async (request) => {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return zodFail(parsed.error);
  const { title, body, link, courseId } = parsed.data;
  const payload = { type: "ANNOUNCEMENT", title, body: body || null, link: link || null };
  const sent = courseId
    ? await notifyCourseStudents(courseId, payload)
    : await notifyAllStudents(payload);
  return ok({ sent }, { message: `${sent} জনকে নোটিশ পাঠানো হয়েছে` });
});
