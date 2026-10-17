import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { submitAttempt } from "@/lib/services/attempt.service";

export const POST = withAuth(async (request, { user, params }) => {
  const summary = await submitAttempt(params.id, user.id);
  return ok(summary);
});
