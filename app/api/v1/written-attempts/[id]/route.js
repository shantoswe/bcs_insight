import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { getWrittenResult } from "@/lib/services/written.service";

// Student's own written result (model answers if the exam allows).
export const GET = withAuth(async (request, { user, params }) =>
  ok(await getWrittenResult(params.id, user.id))
);
