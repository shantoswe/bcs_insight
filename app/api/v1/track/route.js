import { withPublic } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { track } from "@/lib/services/tracking.service";

// Browser → server relay. The page fires the Pixel/gtag event client-side and
// also POSTs here with the same eventId; the server sends Meta CAPI + GA4 MP
// copies (with IP/UA/fbp/fbc), which Meta/GA deduplicate against the browser
// event. Best-effort, rate-limited, never blocks the user.
export const POST = withPublic(
  async (request) => {
    const body = await request.json().catch(() => ({}));
    const { eventId } = await track({
      event: body.event || "PageView",
      request,
      eventId: body.eventId,
      url: body.url,
      customData: body.customData || {},
      userData: body.userData || {},
      clientId: body.clientId,
    });
    return ok({ eventId });
  },
  { limit: 120, windowMs: 60_000 }
);
