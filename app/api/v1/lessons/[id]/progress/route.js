import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { saveLessonProgress } from "@/lib/services/progress.service";

export const POST = withAuth(async (request, { user, params }) => {
  const body = await request.json();
  const p = await saveLessonProgress(user.id, params.id, {
    lastPositionSeconds: body.lastPositionSeconds,
    completed: body.completed,
  });
  return ok({ completed: p.completed, lastPositionSeconds: p.lastPositionSeconds });
}, { limit: 400 });
