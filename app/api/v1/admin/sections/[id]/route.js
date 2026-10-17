import { withAdmin } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { updateSection, deleteSection } from "@/lib/services/course.service";

export const PATCH = withAdmin(async (request, { params }) => {
  const body = await request.json();
  const section = await updateSection(params.id, {
    ...(body.titleEn !== undefined && { titleEn: body.titleEn }),
    ...(body.titleBn !== undefined && { titleBn: body.titleBn || null }),
    ...(body.order !== undefined && { order: Number(body.order) }),
  });
  return ok(section);
});

export const DELETE = withAdmin(async (request, { params }) => {
  await deleteSection(params.id);
  return ok({ deleted: true });
});
