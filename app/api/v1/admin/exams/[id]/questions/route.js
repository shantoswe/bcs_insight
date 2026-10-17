import { withAdmin } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { appendExamQuestions, removeExamQuestion, setQuestionMarks } from "@/lib/services/exam.service";

// POST { questionIds: [] } → attach; also handles marks + removal via body.action
export const POST = withAdmin(async (request, { params }) => {
  const body = await request.json();
  if (body.action === "remove") {
    await removeExamQuestion(params.id, body.questionId);
    return ok({ removed: true });
  }
  if (body.action === "marks") {
    await setQuestionMarks(params.id, body.questionId, Number(body.marks) || 1);
    return ok({ updated: true });
  }
  const added = await appendExamQuestions(params.id, body.questionIds ?? []);
  return ok({ added }, { message: `${added}টি প্রশ্ন যুক্ত হয়েছে` });
});
