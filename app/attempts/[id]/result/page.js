import { requireUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/services/settings.service";
import { SiteHeader } from "@/components/layout/site-header";
import { ResultView } from "@/components/exams/result-view";

export const metadata = { title: "ফলাফল" };

export default async function ResultPage({ params }) {
  const user = await requireUser();
  let settings = {};
  try { settings = await getSettings(); } catch {}
  const brand = { siteName: settings.siteName || "BCS Insight", logoUrl: settings.logoUrl || "" };
  const { id } = await params;
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={user} brand={brand} settings={settings} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <ResultView attemptId={id} />
      </main>
    </div>
  );
}
