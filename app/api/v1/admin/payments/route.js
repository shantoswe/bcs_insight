import { withAdmin } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { listPaymentRequests } from "@/lib/services/payment.service";

// Admin list of payment requests. ?status=PENDING|APPROVED|REJECTED
export const GET = withAdmin(async (request) => {
  const status = new URL(request.url).searchParams.get("status") || undefined;
  return ok(await listPaymentRequests({ status }));
});
