import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { getAttemptResult } from "@/lib/services/attempt.service";

export const GET = withAuth(async (request, { user, params }) => {
  const data = await getAttemptResult(params.id, user.id);
  return ok(data);
});
