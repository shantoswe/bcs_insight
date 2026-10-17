import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { saveAnswer } from "@/lib/services/attempt.service";

export const POST = withAuth(async (request, { user, params }) => {
  const body = await request.json();
  const result = await saveAnswer(params.id, user.id, {
    questionId: body.questionId,
    selectedOptionId: body.selectedOptionId ?? null,
    markedForReview: body.markedForReview,
  });
  return ok(result);
}, { limit: 600 }); // frequent auto-saves during an exam
