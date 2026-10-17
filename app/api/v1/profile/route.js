import { withAuth } from "@/lib/api/guard";
import { ok, zodFail } from "@/lib/api/response";
import { getProfile, updateProfile } from "@/lib/services/user.service";
import { profileSchema } from "@/lib/validators/user";

export const GET = withAuth(async (request, { user }) => ok(await getProfile(user.id)));

export const PATCH = withAuth(async (request, { user }) => {
  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) return zodFail(parsed.error);
  const updated = await updateProfile(user.id, parsed.data);
  return ok(updated, { message: "প্রোফাইল হালনাগাদ হয়েছে" });
});
