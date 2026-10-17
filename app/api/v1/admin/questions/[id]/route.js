import { withAdmin } from "@/lib/api/guard";
import { ok, zodFail } from "@/lib/api/response";
import { updateQuestion, deleteQuestion } from "@/lib/services/question.service";
import { questionUpdateSchema } from "@/lib/validators/question";

export const PATCH = withAdmin(async (request, { params }) => {
  const parsed = questionUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return zodFail(parsed.error);
  const q = await updateQuestion(params.id, parsed.data);
  return ok(q, { message: "প্রশ্ন হালনাগাদ হয়েছে" });
});

export const DELETE = withAdmin(async (request, { params }) => {
  await deleteQuestion(params.id);
  return ok({ deleted: true });
});
