import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/guard";

// Streams a stored PDF/audio through our origin so the PDF annotator and
// players avoid cross-origin CORS issues. Only files on our own Supabase
// Storage host are allowed.
const SUPABASE_HOST = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace("https://", "");
const MAX_BYTES = 50 * 1024 * 1024;

export const GET = withAuth(async (request) => {
  const url = new URL(request.url).searchParams.get("url");
  if (!url) return new NextResponse("Missing url", { status: 400 });

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }
  if (parsed.hostname !== SUPABASE_HOST) return new NextResponse("Forbidden", { status: 403 });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  const res = await fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeout));
  if (!res.ok) return new NextResponse("Fetch failed", { status: 502 });

  const len = parseInt(res.headers.get("content-length") || "0", 10);
  if (len > MAX_BYTES) return new NextResponse("File too large", { status: 413 });

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > MAX_BYTES) return new NextResponse("File too large", { status: 413 });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": res.headers.get("content-type") || "application/pdf",
      "Cache-Control": "private, max-age=300",
    },
  });
});
