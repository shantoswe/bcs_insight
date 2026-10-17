import { withAdmin } from "@/lib/api/guard";
import { ok, zodFail } from "@/lib/api/response";
import { getExamForAdmin, updateExam, deleteExam } from "@/lib/services/exam.service";
import { examUpdateSchema } from "@/lib/validators/exam";

export const GET = withAdmin(async (request, { params }) => {
  const exam = await getExamForAdmin(params.id);
  return ok(exam);
});

export const PATCH = withAdmin(async (request, { params }) => {
  const parsed = examUpdateSchema.safeParse(await request.json());
  if (!parsed.success) return zodFail(parsed.error);
  const exam = await updateExam(params.id, parsed.data);
  return ok(exam, { message: "হালনাগাদ হয়েছে" });
});

export const DELETE = withAdmin(async (request, { params }) => {
  await deleteExam(params.id);
  return ok({ deleted: true });
});
