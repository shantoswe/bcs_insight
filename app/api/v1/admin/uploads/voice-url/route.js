import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/api/guard";
import { getPresignedUploadUrl } from "@/lib/storage";

// Evaluator presign: voice-feedback audio → Supabase Storage.
export const POST = withAdmin(async (request) => {
  const { contentType } = await request.json().catch(() => ({}));
  const mime = contentType || "audio/mp4";
  const ext = mime.includes("webm") ? ".webm" : mime.includes("ogg") ? ".ogg" : ".mp4";
  const { uploadUrl, publicUrl } = await getPresignedUploadUrl("voice", ext);
  return NextResponse.json({ uploadUrl, publicUrl });
});
