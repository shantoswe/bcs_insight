import { withAuth } from "@/lib/api/guard";
import { ok, zodFail } from "@/lib/api/response";
import { paymentRequestSchema } from "@/lib/validators/payment";
import { createPaymentRequest, myRequestForCourse } from "@/lib/services/payment.service";

// Student submits a manual payment for a paid course (awaits admin approval).
export const POST = withAuth(async (request, { user, params }) => {
  const parsed = paymentRequestSchema.safeParse(await request.json());
  if (!parsed.success) return zodFail(parsed.error);
  const req = await createPaymentRequest(user.id, params.id, parsed.data);
  return ok(
    { id: req.id, status: req.status },
    { message: "পেমেন্ট জমা হয়েছে — অ্যাডমিন যাচাই করে অনুমোদন করবেন" }
  );
});

export const GET = withAuth(async (request, { user, params }) =>
  ok(await myRequestForCourse(user.id, params.id))
);
