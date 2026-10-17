import { withAdmin } from "@/lib/api/guard";
import { ok, zodFail } from "@/lib/api/response";
import { updateTopic, deleteTopic } from "@/lib/services/taxonomy.service";
import { topicSchema } from "@/lib/validators/taxonomy";

export const PATCH = withAdmin(async (request, { params }) => {
  const parsed = topicSchema.partial().safeParse(await request.json());
  if (!parsed.success) return zodFail(parsed.error);
  return ok(await updateTopic(params.id, parsed.data), { message: "হালনাগাদ হয়েছে" });
});

export const DELETE = withAdmin(async (request, { params }) => {
  await deleteTopic(params.id);
  return ok({ deleted: true });
});
