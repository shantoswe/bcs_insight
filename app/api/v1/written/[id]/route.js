import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { getWrittenForTaking } from "@/lib/services/written.service";

export const GET = withAuth(async (request, { user, params }) =>
  ok(await getWrittenForTaking(params.id, user.id))
);
