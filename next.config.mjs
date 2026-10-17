/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone-friendly Node server for DigitalOcean (PM2 + `next start`).
  // No Vercel-only APIs are used anywhere in this app.
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    // Deploys should not fail the build on lint; run `npm run lint` in CI.
    ignoreDuringBuilds: true,
  },
  images: {
    // Bunny CDN thumbnails + Supabase signed image URLs
    remotePatterns: [
      { protocol: "https", hostname: "**.b-cdn.net" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  // Pin the tracing root to this project so the sibling reference apps (each
  // with its own lockfile) don't confuse Next's workspace-root inference.
  outputFileTracingRoot: import.meta.dirname,
  // The two reference apps live in sibling folders; never bundle them.
  outputFileTracingExcludes: {
    "*": ["./aus-bcs/**", "./alokbortika/**"],
  },
};

export default nextConfig;
