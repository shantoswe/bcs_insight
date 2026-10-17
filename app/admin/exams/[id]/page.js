import { requireStaff } from "@/lib/auth/session";
import { ExamBuilder } from "@/components/admin/exam-builder";

export default async function AdminExamBuilderPage({ params }) {
  await requireStaff("exams");
  const { id } = await params;
  return (
    <div className="p-5 lg:p-8">
      <ExamBuilder examId={id} />
    </div>
  );
}
