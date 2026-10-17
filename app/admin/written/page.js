import { requireStaff } from "@/lib/auth/session";
import { WrittenManager } from "@/components/admin/written-manager";

export default async function AdminWrittenPage() {
  await requireStaff("written");
  return (
    <div className="p-5 lg:p-8">
      <h1 className="text-2xl font-bold">লিখিত পরীক্ষা</h1>
      <p className="mb-6 text-muted-foreground">প্রশ্ন ও মডেল উত্তর যোগ করুন, শিক্ষার্থীর উত্তর মূল্যায়ন করুন।</p>
      <WrittenManager />
    </div>
  );
}
