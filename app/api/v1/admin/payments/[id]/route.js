import { withAdmin } from "@/lib/api/guard";
import { ok, zodFail } from "@/lib/api/response";
import { paymentReviewSchema } from "@/lib/validators/payment";
import { reviewPaymentRequest } from "@/lib/services/payment.service";

// Approve (→ enroll + notify) or reject a payment request.
export const POST = withAdmin(async (request, { user, params }) => {
  const parsed = paymentReviewSchema.safeParse(await request.json());
  if (!parsed.success) return zodFail(parsed.error);
  const result = await reviewPaymentRequest(params.id, user.id, parsed.data);
  return ok(result, {
    message: result.status === "APPROVED" ? "অনুমোদিত — শিক্ষার্থী ভর্তি হয়েছেন" : "বাতিল করা হয়েছে",
  });
});
