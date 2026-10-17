import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/guard";
import { getPresignedUploadUrl } from "@/lib/storage";

// Student presign: direct PDF answer-sheet upload → Supabase Storage.
export const POST = withAuth(async (request) => {
  const { contentType } = await request.json().catch(() => ({}));
  if (contentType !== "application/pdf")
    return NextResponse.json({ error: "শুধুমাত্র PDF আপলোড করা যাবে" }, { status: 400 });

  const { uploadUrl, publicUrl } = await getPresignedUploadUrl("written-answers", ".pdf");
  return NextResponse.json({ uploadUrl, publicUrl });
});
