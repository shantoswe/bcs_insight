import { requireStaff } from "@/lib/auth/session";
import { PaymentsManager } from "@/components/admin/payments-manager";

export default async function AdminPaymentsPage() {
  await requireStaff("courses");
  return (
    <div className="p-5 lg:p-8">
      <h1 className="text-2xl font-bold">পেমেন্ট অনুমোদন</h1>
      <p className="mb-6 text-muted-foreground">শিক্ষার্থীদের বিকাশ/নগদ/রকেট পেমেন্ট যাচাই করে কোর্সে ভর্তি অনুমোদন করুন।</p>
      <PaymentsManager />
    </div>
  );
}
