import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { enroll } from "@/lib/services/course.service";
import { track } from "@/lib/services/tracking.service";

// Free-enroll endpoint. (Paid enrollment would gate on a Payment record.)
export const POST = withAuth(async (request, { user, params }) => {
  await enroll(user.id, params.id);

  // Server-side conversion (Meta CAPI + GA4 Measurement Protocol). Fires from
  // the backend so it lands even if the browser drops the event.
  track({
    event: "EnrollCourse",
    request,
    userData: { externalId: user.id, email: user.email, phone: user.phone },
    customData: { content_type: "course", content_ids: [params.id], currency: "BDT", value: 0 },
  }).catch(() => {});

  return ok({ enrolled: true }, { message: "কোর্সে যুক্ত হয়েছেন" });
});
