import { withAdmin } from "@/lib/api/guard";
import { ok, zodFail } from "@/lib/api/response";
import { listTopics, createTopic } from "@/lib/services/taxonomy.service";
import { topicSchema } from "@/lib/validators/taxonomy";

export const GET = withAdmin(async (request) => {
  const subjectId = new URL(request.url).searchParams.get("subjectId") || undefined;
  return ok(await listTopics({ subjectId }));
});

export const POST = withAdmin(async (request) => {
  const parsed = topicSchema.safeParse(await request.json());
  if (!parsed.success) return zodFail(parsed.error);
  return ok(await createTopic(parsed.data), { status: 201, message: "যুক্ত হয়েছে" });
});
