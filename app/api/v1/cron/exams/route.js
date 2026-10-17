import { NextResponse } from "next/server";
import { processLiveExams } from "@/lib/services/attempt.service";
import { publishResults } from "@/lib/services/exam.service";

// PM2/systemd cron hits this to flip live-exam states and publish results.
// Protected by a bearer token (CRON_SECRET). A traffic-driven in-app sweep
// also runs, so this is a fallback for idle periods.
export async function GET(request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const out = await processLiveExams();
  for (const examId of out.resultsPublished) await publishResults(examId);

  return NextResponse.json({ success: true, data: out });
}
