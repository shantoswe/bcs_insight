import { ExamList } from "@/components/exams/exam-list";

export const metadata = { title: "পরীক্ষা" };

export default function ExamsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">পরীক্ষা</h1>
        <p className="text-muted-foreground">লাইভ মক টেস্ট ও প্র্যাকটিস পরীক্ষায় অংশ নিন।</p>
      </div>
      <ExamList />
    </div>
  );
}
