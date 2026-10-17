import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { startAttempt } from "@/lib/services/attempt.service";

export const POST = withAuth(async (request, { user, params }) => {
  const result = await startAttempt(params.id, user.id);
  return ok(result);
});
