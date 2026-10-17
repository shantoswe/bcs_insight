import { prisma } from "@/lib/prisma";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap() {
  const staticRoutes = ["", "/exams", "/practice", "/written", "/courses", "/login", "/register"].map(
    (p) => ({ url: `${SITE}${p}`, lastModified: new Date(), changeFrequency: "daily", priority: p === "" ? 1 : 0.7 })
  );

  let courses = [];
  try {
    const rows = await prisma.course.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    });
    courses = rows.map((c) => ({
      url: `${SITE}/courses/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch {
    /* DB unavailable at build time — static routes still emitted */
  }

  return [...staticRoutes, ...courses];
}
