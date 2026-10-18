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

// Private bucket for course material (lesson PDFs). Nothing here is publicly
// readable: every download is a short-lived signed URL minted only after the
// enrollment check in /api/v1/lessons/[id]/file.
export const LESSON_BUCKET = "lesson-files";

export async function getPresignedLessonUpload(ext = ".pdf", { expiresIn = 900 } = {}) {
  const key = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
  const supabase = createAdminClient();
  await ensureLessonBucket(supabase);
  const { data, error } = await supabase.storage
    .from(LESSON_BUCKET)
    .createSignedUploadUrl(key, { expiresIn });
  if (error) throw error;
  return { uploadUrl: data.signedUrl, path: key };
}

// Signed read URL for a stored lesson file.
export async function signedLessonUrl(path, { expiresIn = 600 } = {}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from(LESSON_BUCKET).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

async function ensureLessonBucket(supabase) {
  const { data } = await supabase.storage.getBucket(LESSON_BUCKET);
  if (data) return;
  // no fileSizeLimit: inherit the project-wide upload limit
  await supabase.storage.createBucket(LESSON_BUCKET, { public: false });
}
