import { withAdmin } from "@/lib/api/guard";
import { ok, parsePagination, paginationMeta } from "@/lib/api/response";
import { listUsers } from "@/lib/services/user.service";

export const GET = withAdmin(async (request) => {
  const p = new URL(request.url).searchParams;
  const { skip, take, page, limit } = parsePagination(p, { defaultLimit: 25 });
  const bannedParam = p.get("banned");
  const { users, total } = await listUsers({
    search: p.get("search") || undefined,
    role: p.get("role") || undefined,
    banned: bannedParam == null ? null : bannedParam === "true",
    skip,
    take,
  });
  return ok(users, { meta: paginationMeta({ page, limit, total }) });
});
