import { requireStaff } from "@/lib/auth/session";
import { ExamsManager } from "@/components/admin/exams-manager";

export default async function AdminExamsPage() {
  await requireStaff("exams");
  return (
    <div className="p-5 lg:p-8">
      <h1 className="text-2xl font-bold">MCQ পরীক্ষা</h1>
      <p className="mb-6 text-muted-foreground">প্র্যাকটিস ও লাইভ মক টেস্ট তৈরি ও পরিচালনা করুন।</p>
      <ExamsManager />
    </div>
  );
}
