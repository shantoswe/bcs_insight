import "server-only";
import crypto from "crypto";

// Server-side Bunny Stream API. The API key never leaves the server — the
// browser gets only a short-lived presigned signature for the TUS upload,
// so video bytes go browser → Bunny directly, never through Node.

const API_BASE = "https://video.bunnycdn.com";
const LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;
const API_KEY = process.env.BUNNY_STREAM_API_KEY;

function assertConfigured() {
  if (!LIBRARY_ID || !API_KEY)
    throw new Error("Bunny Stream is not configured (set BUNNY_STREAM_API_KEY and NEXT_PUBLIC_BUNNY_LIBRARY_ID)");
}

function headers() {
  return { AccessKey: API_KEY, "Content-Type": "application/json", Accept: "application/json" };
}

// Create an empty video object; returns its GUID for the browser upload.
export async function createVideo(title) {
  assertConfigured();
  const res = await fetch(`${API_BASE}/library/${LIBRARY_ID}/videos`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ title: title || "Untitled lesson" }),
  });
  if (!res.ok) throw new Error(`Bunny createVideo failed (${res.status})`);
  const data = await res.json();
  return data.guid;
}

// Presign a TUS resumable upload. The browser sends these as headers:
//   AuthorizationSignature, AuthorizationExpire, VideoId, LibraryId
// signature = sha256( libraryId + apiKey + expireUnix + videoId )
export function presignUpload(videoId, { ttlSeconds = 3600 } = {}) {
  assertConfigured();
  const expire = Math.floor(Date.now() / 1000) + ttlSeconds;
  const signature = crypto
    .createHash("sha256")
    .update(`${LIBRARY_ID}${API_KEY}${expire}${videoId}`)
    .digest("hex");
  return { libraryId: LIBRARY_ID, videoId, signature, expire };
}

// Bunny status codes → our VideoStatus enum.
const STATUS_MAP = {
  0: "CREATED",
  1: "UPLOADING",
  2: "PROCESSING",
  3: "PROCESSING",
  4: "READY",
  5: "FAILED",
  6: "FAILED",
};

export async function getVideo(videoId) {
  assertConfigured();
  const res = await fetch(`${API_BASE}/library/${LIBRARY_ID}/videos/${videoId}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Bunny getVideo failed (${res.status})`);
  const v = await res.json();
  return {
    guid: v.guid,
    status: STATUS_MAP[v.status] ?? "PROCESSING",
    durationSeconds: v.length ? Math.round(v.length) : null,
    title: v.title,
  };
}

export async function deleteVideo(videoId) {
  assertConfigured();
  await fetch(`${API_BASE}/library/${LIBRARY_ID}/videos/${videoId}`, {
    method: "DELETE",
    headers: headers(),
  }).catch(() => {});
}

// Build a playback embed URL. When the library's Token Authentication key is
// set, the URL is signed and short-lived, so it can't be shared/hotlinked and
// expires quickly. Without a key it falls back to a plain embed (dev only).
export function signedEmbedUrl(videoId, { ttlSeconds = 4 * 3600, autoplay = false } = {}) {
  const base = `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${videoId}`;
  const params = new URLSearchParams({
    autoplay: String(autoplay),
    preload: "true",
    responsive: "true",
  });

  const key = process.env.BUNNY_STREAM_TOKEN_AUTH_KEY;
  if (key) {
    const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
    // Bunny embed token = sha256_hex( tokenKey + videoId + expires )
    const token = crypto.createHash("sha256").update(`${key}${videoId}${expires}`).digest("hex");
    params.set("token", token);
    params.set("expires", String(expires));
  }
  return `${base}?${params.toString()}`;
}
