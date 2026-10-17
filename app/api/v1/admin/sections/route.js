import { withAdmin } from "@/lib/api/guard";
import { ok, zodFail } from "@/lib/api/response";
import { createSection } from "@/lib/services/course.service";
import { sectionSchema } from "@/lib/validators/course";

export const POST = withAdmin(async (request) => {
  const parsed = sectionSchema.safeParse(await request.json());
  if (!parsed.success) return zodFail(parsed.error);
  const section = await createSection(parsed.data);
  return ok(section, { status: 201 });
});
