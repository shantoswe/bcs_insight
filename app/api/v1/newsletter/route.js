import { z } from "zod";
import { withPublic } from "@/lib/api/guard";
import { ok, zodFail } from "@/lib/api/response";
import { getSettings, updateSettings } from "@/lib/services/settings.service";

const schema = z.object({ email: z.string().trim().email("সঠিক ইমেইল দিন").max(200) });

// Newsletter sign-up. Subscribers are kept in the SiteSetting table
// ("newsletter.subscribers") so no extra table is required.
export const POST = withPublic(
  async (request) => {
    const parsed = schema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return zodFail(parsed.error);
    const email = parsed.data.email.toLowerCase();

    const settings = await getSettings();
    const list = Array.isArray(settings["newsletter.subscribers"])
      ? settings["newsletter.subscribers"]
      : [];

    if (!list.some((s) => (s.email ?? s) === email)) {
      await updateSettings({
        "newsletter.subscribers": [...list, { email, at: new Date().toISOString() }],
      });
    }
    return ok({ subscribed: true }, { message: "সাবস্ক্রাইব সম্পন্ন" });
  },
  { limit: 10, windowMs: 60_000 }
);
