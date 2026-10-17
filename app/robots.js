const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // don't index private/app surfaces
        disallow: ["/admin", "/dashboard", "/attempts", "/api", "/auth", "/profile", "/mistakes"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
