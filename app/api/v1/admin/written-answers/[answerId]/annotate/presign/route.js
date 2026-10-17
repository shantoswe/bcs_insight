import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/api/guard";
import { getPresignedUploadUrl } from "@/lib/storage";

// Evaluator presign: annotated answer-sheet PDF → Supabase Storage.
export const POST = withAdmin(async () => {
  const { uploadUrl, publicUrl } = await getPresignedUploadUrl("annotated", ".pdf");
  return NextResponse.json({ uploadUrl, publicUrl });
});
