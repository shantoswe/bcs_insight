import { withAdmin } from "@/lib/api/guard";
import { ok, zodFail, parsePagination, paginationMeta } from "@/lib/api/response";
import { listQuestions, createQuestion } from "@/lib/services/question.service";
import { questionSchema } from "@/lib/validators/question";

export const GET = withAdmin(async (request) => {
  const p = new URL(request.url).searchParams;
  const { skip, take, page, limit } = parsePagination(p, { defaultLimit: 20 });
  const { questions, total } = await listQuestions({
    subjectId: p.get("subjectId") || undefined,
    topicId: p.get("topicId") || undefined,
    difficulty: p.get("difficulty") || undefined,
    status: p.get("status") || undefined,
    search: p.get("search") || undefined,
    skip,
    take,
  });
  return ok(questions, { meta: paginationMeta({ page, limit, total }) });
});

export const POST = withAdmin(async (request, { user }) => {
  const parsed = questionSchema.safeParse(await request.json());
  if (!parsed.success) return zodFail(parsed.error);
  const q = await createQuestion(parsed.data, user.id);
  return ok(q, { message: "প্রশ্ন যুক্ত হয়েছে", status: 201 });
});
