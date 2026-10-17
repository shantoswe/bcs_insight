// Client-safe Bunny Stream helpers (no secrets). The library id and CDN host
// are public; the API key lives only in server code (lib/services/bunny.service.js).

export const BUNNY_LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID;
export const BUNNY_CDN_HOST = process.env.NEXT_PUBLIC_BUNNY_CDN_HOST;

// Iframe embed player — handles HLS, adaptive bitrate and mobile natively.
export function bunnyEmbedUrl(videoId, { autoplay = false } = {}) {
  if (!videoId || !BUNNY_LIBRARY_ID) return null;
  const params = new URLSearchParams({
    autoplay: String(autoplay),
    preload: "true",
    responsive: "true",
  });
  return `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${videoId}?${params}`;
}

// Poster/thumbnail served from the pull-zone CDN.
export function bunnyThumbnailUrl(videoId) {
  if (!videoId || !BUNNY_CDN_HOST) return null;
  return `https://${BUNNY_CDN_HOST}/${videoId}/thumbnail.jpg`;
}

// Direct HLS playlist (if you build a custom player instead of the iframe).
export function bunnyHlsUrl(videoId) {
  if (!videoId || !BUNNY_CDN_HOST) return null;
  return `https://${BUNNY_CDN_HOST}/${videoId}/playlist.m3u8`;
}

export const TUS_ENDPOINT = "https://video.bunnycdn.com/tusupload";
