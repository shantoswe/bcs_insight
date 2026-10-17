import { withAdmin } from "@/lib/api/guard";
import { ok, zodFail, fail } from "@/lib/api/response";
import { setRole, setBanStatus, deleteUser } from "@/lib/services/user.service";
import { setRoleSchema, banSchema } from "@/lib/validators/user";

// action: "role" | "ban"
export const PATCH = withAdmin(async (request, { user, params }) => {
  if (params.id === user.id) return fail("নিজের অ্যাকাউন্ট পরিবর্তন করা যাবে না", { status: 409 });
  const body = await request.json();

  if (body.action === "ban") {
    const parsed = banSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);
    await setBanStatus(params.id, parsed.data);
    return ok({ updated: true }, { message: parsed.data.isBanned ? "নিষিদ্ধ করা হয়েছে" : "নিষেধাজ্ঞা তুলে নেওয়া হয়েছে" });
  }

  const parsed = setRoleSchema.safeParse(body);
  if (!parsed.success) return zodFail(parsed.error);
  await setRole(params.id, parsed.data.role, parsed.data.permissions);
  return ok({ updated: true }, { message: "রোল হালনাগাদ হয়েছে" });
});

export const DELETE = withAdmin(async (request, { user, params }) => {
  if (params.id === user.id) return fail("নিজের অ্যাকাউন্ট মোছা যাবে না", { status: 409 });
  await deleteUser(params.id);
  return ok({ deleted: true });
});
