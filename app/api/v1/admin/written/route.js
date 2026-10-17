import { withAdmin } from "@/lib/api/guard";
import { ok, zodFail } from "@/lib/api/response";
import { listWrittenForAdmin, createWrittenExam } from "@/lib/services/written.service";
import { writtenExamSchema } from "@/lib/validators/written";

export const GET = withAdmin(async () => ok(await listWrittenForAdmin()));

export const POST = withAdmin(async (request) => {
  const parsed = writtenExamSchema.safeParse(await request.json());
  if (!parsed.success) return zodFail(parsed.error);
  const exam = await createWrittenExam(parsed.data);
  return ok(exam, { message: "লিখিত পরীক্ষা তৈরি হয়েছে", status: 201 });
});
