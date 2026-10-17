import { withAdmin } from "@/lib/api/guard";
import { ok, zodFail } from "@/lib/api/response";
import { updateCategory, deleteCategory } from "@/lib/services/taxonomy.service";
import { categorySchema } from "@/lib/validators/taxonomy";

export const PATCH = withAdmin(async (request, { params }) => {
  const parsed = categorySchema.partial().safeParse(await request.json());
  if (!parsed.success) return zodFail(parsed.error);
  return ok(await updateCategory(params.id, parsed.data), { message: "হালনাগাদ হয়েছে" });
});

export const DELETE = withAdmin(async (request, { params }) => {
  await deleteCategory(params.id);
  return ok({ deleted: true });
});
