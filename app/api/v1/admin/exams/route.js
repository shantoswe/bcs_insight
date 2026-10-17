import { withAdmin } from "@/lib/api/guard";
import { ok, zodFail } from "@/lib/api/response";
import { listExamsForAdmin, createExam } from "@/lib/services/exam.service";
import { examSchema } from "@/lib/validators/exam";

export const GET = withAdmin(async (request) => {
  const p = new URL(request.url).searchParams;
  const exams = await listExamsForAdmin({
    type: p.get("type") || undefined,
    status: p.get("status") || undefined,
  });
  return ok(exams);
});

export const POST = withAdmin(async (request, { user }) => {
  const parsed = examSchema.safeParse(await request.json());
  if (!parsed.success) return zodFail(parsed.error);
  const exam = await createExam(parsed.data, user.id);
  return ok(exam, { message: "পরীক্ষা তৈরি হয়েছে", status: 201 });
});
