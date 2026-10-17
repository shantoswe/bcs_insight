import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getExamForIntro } from "@/lib/services/exam.service";
import { ExamIntro } from "@/components/exams/exam-intro";

export const metadata = { title: "পরীক্ষা শুরু" };

export default async function ExamIntroPage({ params }) {
  await requireUser();
  const { id } = await params;
  const exam = await getExamForIntro(id, (await requireUser()).id);
  if (!exam) notFound();
  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <ExamIntro exam={exam} />
    </div>
  );
}
