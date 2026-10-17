import { withAdmin } from "@/lib/api/guard";
import { ok, zodFail } from "@/lib/api/response";
import { getWrittenResult, evaluateWritten } from "@/lib/services/written.service";
import { evaluateSchema } from "@/lib/validators/written";

// Evaluator view of one submission (includes model answers).
export const GET = withAdmin(async (request, { params }) =>
  ok(await getWrittenResult(params.id, null, { asEvaluator: true }))
);

// Save evaluation marks + feedback.
export const POST = withAdmin(async (request, { user, params }) => {
  const parsed = evaluateSchema.safeParse(await request.json());
  if (!parsed.success) return zodFail(parsed.error);
  const result = await evaluateWritten(params.id, user.id, parsed.data);
  return ok(result, { message: "মূল্যায়ন সংরক্ষিত হয়েছে" });
});
