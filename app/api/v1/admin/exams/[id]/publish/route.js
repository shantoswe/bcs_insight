import { withAdmin } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { publishExam, unpublishExam, publishResults } from "@/lib/services/exam.service";

// action: "publish" | "unpublish" | "publish-results"
export const POST = withAdmin(async (request, { params }) => {
  const { action } = await request.json().catch(() => ({ action: "publish" }));
  if (action === "unpublish") {
    const e = await unpublishExam(params.id);
    return ok(e, { message: "খসড়ায় ফেরানো হয়েছে" });
  }
  if (action === "publish-results") {
    const r = await publishResults(params.id);
    return ok(r, { message: `মেধাতালিকা প্রকাশিত (${r.ranked} জন)` });
  }
  const e = await publishExam(params.id);
  return ok(e, { message: "পরীক্ষা প্রকাশিত হয়েছে" });
});
