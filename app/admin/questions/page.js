import { requireStaff } from "@/lib/auth/session";
import { QuestionsManager } from "@/components/admin/questions-manager";

export default async function AdminQuestionsPage() {
  await requireStaff("questions");
  return (
    <div className="p-5 lg:p-8">
      <h1 className="text-2xl font-bold">প্রশ্ন ব্যাংক</h1>
      <p className="mb-6 text-muted-foreground">প্রশ্ন যোগ করুন, সম্পাদনা করুন বা CSV/Excel দিয়ে বাল্ক আপলোড করুন।</p>
      <QuestionsManager />
    </div>
  );
}
