import { z } from "zod";
import { withAuth } from "@/lib/api/guard";
import { ok, zodFail, parsePagination } from "@/lib/api/response";
import { listMyNotifications, markNotificationsRead } from "@/lib/services/notification.service";

export const GET = withAuth(async (request, { user }) => {
  const sp = new URL(request.url).searchParams;
  const { skip, take } = parsePagination(sp, { defaultLimit: 15 });
  const { items, total, unread } = await listMyNotifications(user.id, { skip, take });
  return ok(items, { meta: { total, unread } });
});

const readSchema = z.object({
  ids: z.array(z.string()).optional(),
  all: z.boolean().optional(),
});

// POST { ids: [...] } or { all: true } → mark read
export const POST = withAuth(async (request, { user }) => {
  const parsed = readSchema.safeParse(await request.json());
  if (!parsed.success) return zodFail(parsed.error);
  const count = await markNotificationsRead(user.id, parsed.data);
  return ok({ marked: count });
});
