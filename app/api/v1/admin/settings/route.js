import { withAdmin } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { getSettings, updateSettings } from "@/lib/services/settings.service";

export const GET = withAdmin(async () => ok(await getSettings()));

export const PATCH = withAdmin(async (request) => {
  const patch = await request.json();
  return ok(await updateSettings(patch), { message: "সেটিংস সংরক্ষিত হয়েছে" });
});
