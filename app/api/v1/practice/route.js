import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { getPracticeQuestions } from "@/lib/services/question.service";

// Practice questions with instant-feedback answers + explanations.
export const GET = withAuth(async (request) => {
  const p = new URL(request.url).searchParams;
  const questions = await getPracticeQuestions({
    subjectId: p.get("subjectId") || undefined,
    topicId: p.get("topicId") || undefined,
    difficulty: p.get("difficulty") || undefined,
    limit: parseInt(p.get("limit") ?? "20", 10),
  });
  return ok(questions);
});
