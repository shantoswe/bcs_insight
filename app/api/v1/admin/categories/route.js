import { withAdmin } from "@/lib/api/guard";
import { ok, zodFail } from "@/lib/api/response";
import { listCategories, createCategory } from "@/lib/services/taxonomy.service";
import { categorySchema } from "@/lib/validators/taxonomy";

export const GET = withAdmin(async () => ok(await listCategories()));

export const POST = withAdmin(async (request) => {
  const parsed = categorySchema.safeParse(await request.json());
  if (!parsed.success) return zodFail(parsed.error);
  return ok(await createCategory(parsed.data), { status: 201, message: "যুক্ত হয়েছে" });
});
