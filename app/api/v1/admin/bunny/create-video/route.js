import { withAdmin } from "@/lib/api/guard";
import { ok, fail } from "@/lib/api/response";
import { createVideo, presignUpload } from "@/lib/services/bunny.service";

// Create an empty Bunny video and return a short-lived presigned TUS upload.
// The browser uploads bytes straight to Bunny — they never touch this server.
export const POST = withAdmin(async (request) => {
  const { title } = await request.json().catch(() => ({}));
  try {
    const videoId = await createVideo(title);
    const presign = presignUpload(videoId, { ttlSeconds: 6 * 3600 });
    return ok({ videoId, ...presign });
  } catch (e) {
    return fail(e.message || "Bunny error", { status: 502 });
  }
});
