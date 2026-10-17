import { withAuth } from "@/lib/api/guard";
import { ok, zodFail } from "@/lib/api/response";
import { writtenSubmitSchema } from "@/lib/validators/written";
import { submitWritten } from "@/lib/services/written.service";

export const POST = withAuth(async (request, { user, params }) => {
  const parsed = writtenSubmitSchema.safeParse(await request.json());
  if (!parsed.success) return zodFail(parsed.error);
  const result = await submitWritten(params.id, user.id, parsed.data.answers);
  return ok(result, { message: "উত্তর জমা হয়েছে" });
});
