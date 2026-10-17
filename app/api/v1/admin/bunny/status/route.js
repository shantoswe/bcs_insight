import { withAdmin } from "@/lib/api/guard";
import { ok, fail } from "@/lib/api/response";
import { getVideo } from "@/lib/services/bunny.service";

// Poll Bunny transcode status for a video id (admin lesson editor).
export const GET = withAdmin(async (request) => {
  const videoId = new URL(request.url).searchParams.get("videoId");
  if (!videoId) return fail("videoId required");
  try {
    const v = await getVideo(videoId);
    return ok(v);
  } catch (e) {
    return fail(e.message || "Bunny error", { status: 502 });
  }
});
