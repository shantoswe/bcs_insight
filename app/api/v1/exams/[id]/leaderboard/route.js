import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { getLeaderboard } from "@/lib/services/exam.service";

export const GET = withAuth(async (request, { params }) => {
  const data = await getLeaderboard(params.id, { limit: 100 });
  return ok(data);
});
