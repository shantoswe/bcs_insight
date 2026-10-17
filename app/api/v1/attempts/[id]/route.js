import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { getAttemptState } from "@/lib/services/attempt.service";

// Exam-room state: frozen questions + saved answers (never leaks correct answers).
export const GET = withAuth(async (request, { user, params }) => {
  const state = await getAttemptState(params.id, user.id);
  return ok(state);
});
