import { withAuth } from "@/lib/api/guard";
import { ok, parsePagination, paginationMeta } from "@/lib/api/response";
import { listExamsForStudent } from "@/lib/services/attempt.service";

// Student exam list. ?bucket=live|archive &type=PRACTICE|LIVE &categoryId=
export const GET = withAuth(async (request, { user }) => {
  const p = new URL(request.url).searchParams;
  const { skip, take, page, limit } = parsePagination(p, { defaultLimit: 24 });
  const { exams, total } = await listExamsForStudent({
    userId: user.id,
    type: p.get("type") || undefined,
    bucket: p.get("bucket") || undefined,
    categoryId: p.get("categoryId") || undefined,
    skip,
    take,
  });
  return ok(exams, { meta: paginationMeta({ page, limit, total }) });
});
