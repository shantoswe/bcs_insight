import { withAdmin } from "@/lib/api/guard";
import { ok, zodFail } from "@/lib/api/response";
import {
  getWrittenForAdmin, updateWrittenExam, deleteWrittenExam,
  setWrittenQuestions, publishWritten,
} from "@/lib/services/written.service";
import { writtenExamSchema, writtenQuestionsSchema } from "@/lib/validators/written";

export const GET = withAdmin(async (request, { params }) => ok(await getWrittenForAdmin(params.id)));

export const PATCH = withAdmin(async (request, { params }) => {
  const body = await request.json();

  if (body.action === "questions") {
    const parsed = writtenQuestionsSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);
    const exam = await setWrittenQuestions(params.id, parsed.data.questions);
    return ok(exam, { message: "প্রশ্ন সংরক্ষিত হয়েছে" });
  }
  if (body.action === "publish") {
    const exam = await publishWritten(params.id);
    return ok(exam, { message: "প্রকাশিত হয়েছে" });
  }

  const parsed = writtenExamSchema.partial().safeParse(body);
  if (!parsed.success) return zodFail(parsed.error);
  const exam = await updateWrittenExam(params.id, parsed.data);
  return ok(exam, { message: "হালনাগাদ হয়েছে" });
});

export const DELETE = withAdmin(async (request, { params }) => {
  await deleteWrittenExam(params.id);
  return ok({ deleted: true });
});
