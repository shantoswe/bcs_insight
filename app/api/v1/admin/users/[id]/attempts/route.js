import { withAdmin } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { listUserAttempts } from "@/lib/services/attempt.service";

export const GET = withAdmin(async (request, { params }) =>
  ok(await listUserAttempts(params.id))
);
