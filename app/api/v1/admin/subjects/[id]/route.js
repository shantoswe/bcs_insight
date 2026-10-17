import { withAdmin } from "@/lib/api/guard";
import { ok, zodFail } from "@/lib/api/response";
import { updateSubject, deleteSubject } from "@/lib/services/taxonomy.service";
import { subjectSchema } from "@/lib/validators/taxonomy";

export const PATCH = withAdmin(async (request, { params }) => {
  const parsed = subjectSchema.partial().safeParse(await request.json());
  if (!parsed.success) return zodFail(parsed.error);
  return ok(await updateSubject(params.id, parsed.data), { message: "হালনাগাদ হয়েছে" });
});

export const DELETE = withAdmin(async (request, { params }) => {
  await deleteSubject(params.id);
  return ok({ deleted: true });
});
