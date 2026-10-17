import { withAdmin } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { saveEditedQuestions } from "@/lib/services/import.service";

// Save the (edited) previewed questions to the bank, optionally attaching them
// to an exam. { questions: [...], examId? }
export const POST = withAdmin(async (request, { user }) => {
  const body = await request.json();
  const result = await saveEditedQuestions(body.questions, user.id, { examId: body.examId || null });
  return ok(result, {
    message: `${result.created}টি প্রশ্ন সংরক্ষিত${result.skipped ? `, ${result.skipped}টি বাদ (ডুপ্লিকেট/অসম্পূর্ণ)` : ""}`,
  });
});
