import "server-only";
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError } from "@/lib/api/errors";

// Buckets an admin may browse from the file manager.
export const MANAGED_BUCKETS = ["files", "question-images", "course-assets", "avatars"];
const PUBLIC_BUCKETS = new Set(["files", "course-assets"]);

function assertBucket(bucket) {
  if (!MANAGED_BUCKETS.includes(bucket)) throw new ApiError("Unknown bucket", 400);
}

async function urlFor(supabase, bucket, path) {
  if (PUBLIC_BUCKETS.has(bucket)) {
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

// List objects (files + folders) under a prefix.
export async function listFiles({ bucket = "files", prefix = "" } = {}) {
  assertBucket(bucket);
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(prefix, { limit: 200, sortBy: { column: "created_at", order: "desc" } });
  if (error) throw new ApiError(error.message, 500);

  const items = await Promise.all(
    (data ?? []).map(async (o) => {
      const isFolder = o.id === null; // Supabase marks folders with null id
      const path = prefix ? `${prefix}/${o.name}` : o.name;
      return {
        name: o.name,
        path,
        isFolder,
        size: o.metadata?.size ?? null,
        mimeType: o.metadata?.mimetype ?? null,
        createdAt: o.created_at ?? null,
        url: isFolder ? null : await urlFor(supabase, bucket, path),
      };
    })
  );
  return { bucket, prefix, items };
}

export async function deleteFile({ bucket, path }) {
  assertBucket(bucket);
  if (!path) throw new ApiError("path required", 400);
  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new ApiError(error.message, 500);
  return { deleted: true };
}

// Generic image upload for site assets (logo, favicon, banner/testimonial photos).
export async function uploadAsset(file, { folder = "site" } = {}) {
  const ext = (file.name?.split(".").pop() ?? "png").toLowerCase();
  const key = `${folder}/${Date.now()}-${randomBytes(5).toString("hex")}.${ext}`;
  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from("files")
    .upload(key, file, { contentType: file.type, upsert: false });
  if (error) throw new ApiError(`Upload failed: ${error.message}`, 500);
  return { url: supabase.storage.from("files").getPublicUrl(key).data.publicUrl, path: key };
}
