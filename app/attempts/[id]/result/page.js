import { requireUser } from "@/lib/auth/session";
import { SiteHeader } from "@/components/layout/site-header";
import { ResultView } from "@/components/exams/result-view";

export const metadata = { title: "ফলাফল" };

export default async function ResultPage({ params }) {
  const user = await requireUser();
  const { id } = await params;
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={user} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <ResultView attemptId={id} />
      </main>
    </div>
  );
}
