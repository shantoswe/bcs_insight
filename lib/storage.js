import "server-only";
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// Public bucket for answer-sheet PDFs, evaluator voice notes and annotated PDFs.
// Uploads go straight from the browser to Supabase Storage via a presigned URL,
// so the bytes never pass through the Node server.
const FILES_BUCKET = "files";

// Presign a resumable-free direct PUT. Returns the signed upload URL plus the
// eventual public URL to store in the DB.
export async function getPresignedUploadUrl(folder, ext, { expiresIn = 900 } = {}) {
  const key = `${folder}/${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
  const supabase = createAdminClient();

  const { data, error } = await supabase.storage
    .from(FILES_BUCKET)
    .createSignedUploadUrl(key, { expiresIn });
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(FILES_BUCKET).getPublicUrl(key);

  return { uploadUrl: data.signedUrl, publicUrl, path: key };
}

// Server-side buffer upload (used by the annotate fallback path).
export async function uploadBuffer(buffer, folder, ext, contentType) {
  const key = `${folder}/${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(FILES_BUCKET)
    .upload(key, buffer, { contentType, upsert: false });
  if (error) throw error;
  const {
    data: { publicUrl },
  } = supabase.storage.from(FILES_BUCKET).getPublicUrl(key);
  return { publicUrl, path: key };
}
