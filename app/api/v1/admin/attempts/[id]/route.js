import { withAdmin } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { deleteAttempt } from "@/lib/services/attempt.service";

// Delete an attempt so the student can re-attend the exam (incl. live exams).
export const DELETE = withAdmin(async (request, { params }) => {
  await deleteAttempt(params.id);
  return ok({ deleted: true }, { message: "অ্যাটেম্পট মুছে ফেলা হয়েছে — শিক্ষার্থী আবার অংশ নিতে পারবেন" });
});
