import { withAdmin } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { listWrittenSubmissions } from "@/lib/services/written.service";

export const GET = withAdmin(async (request, { params }) =>
  ok(await listWrittenSubmissions(params.id))
);
