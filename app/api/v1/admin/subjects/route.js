import { withAdmin } from "@/lib/api/guard";
import { ok, zodFail } from "@/lib/api/response";
import { listSubjects, createSubject } from "@/lib/services/taxonomy.service";
import { subjectSchema } from "@/lib/validators/taxonomy";

export const GET = withAdmin(async (request) => {
  const categoryId = new URL(request.url).searchParams.get("categoryId") || undefined;
  return ok(await listSubjects({ categoryId }));
});

export const POST = withAdmin(async (request) => {
  const parsed = subjectSchema.safeParse(await request.json());
  if (!parsed.success) return zodFail(parsed.error);
  return ok(await createSubject(parsed.data), { status: 201, message: "যুক্ত হয়েছে" });
});
