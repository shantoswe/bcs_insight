import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/api/guard";
import { getPresignedLessonUpload } from "@/lib/storage";

// Admin presign: lesson PDF → private Supabase bucket. The browser PUTs the
// file straight to storage, so large PDFs never pass through the Node server.
// Only the storage path is returned — students receive a signed URL from
// /api/v1/lessons/[id]/file after the enrollment check.
export const POST = withAdmin(async (request) => {
  const { contentType } = await request.json().catch(() => ({}));
  if (contentType !== "application/pdf")
    return NextResponse.json({ error: "শুধুমাত্র PDF আপলোড করা যাবে" }, { status: 400 });

  const { uploadUrl, path } = await getPresignedLessonUpload(".pdf");
  return NextResponse.json({ uploadUrl, path });
});
