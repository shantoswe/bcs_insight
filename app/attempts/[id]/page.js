import { requireUser } from "@/lib/auth/session";
import { ExamRoom } from "@/components/exams/exam-room";

export const metadata = { title: "পরীক্ষা চলছে" };

export default async function AttemptPage({ params }) {
  await requireUser();
  const { id } = await params;
  return <ExamRoom attemptId={id} />;
}
