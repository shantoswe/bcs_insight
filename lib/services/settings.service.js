import { prisma } from "@/lib/prisma";
import { warnThrottled } from "@/lib/log";

// All site settings live in the SiteSetting key/JSON table. Values may be
// strings or structured JSON (arrays of banners/videos/testimonials).
const DEFAULTS = {
  // identity + SEO
  siteName: "AUS Prep",
  tagline: "চাকরির পরীক্ষার সম্পূর্ণ প্রস্তুতি",
  logoUrl: "",
  faviconUrl: "",
  seoTitle: "AUS Prep — চাকরির পরীক্ষার প্রস্তুতি",
  seoDescription:
    "MCQ প্র্যাকটিস, টাইমড লাইভ পরীক্ষা, লিখিত মডিউল এবং ভিডিও কোর্স — এক প্ল্যাটফর্মে চাকরির পরীক্ষার সম্পূর্ণ প্রস্তুতি।",
  seoKeywords: "BCS, বিসিএস, ব্যাংক, প্রাইমারি, MCQ, লিখিত পরীক্ষা, চাকরির প্রস্তুতি",
  ogImageUrl: "",

  // hero
  heroBadge: "BCS · ব্যাংক · প্রাইমারি · নিয়োগ",
  heroTitle: "স্বপ্নের চাকরি এখন হাতের মুঠোয়",
  heroSubtitle: "MCQ প্র্যাকটিস, লাইভ পরীক্ষা, লিখিত মডিউল আর ভিডিও কোর্স — সব এক জায়গায়।",
  heroCtaText: "শুরু করুন",
  heroCtaUrl: "/register",
  "home.hero.points": "",

  // video slider — [{ id, title, url }] (YouTube / Bunny / embeddable)
  "home.videos": [],
  // announcement banners — [{ id, title, body, ctaText, ctaUrl, color, active }]
  "home.banners": [],
  // testimonials / reviews — [{ id, name, role, text, rating }]
  "home.testimonials": [],

  // tracking — public IDs (secrets live in env only). Env is the default.
  "tracking.metaPixelId": process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
  "tracking.gaMeasurementId": process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "",
  "tracking.gtmId": process.env.NEXT_PUBLIC_GTM_ID || "",

  // manual payment — receiving numbers shown to students on paid courses.
  // [{ id, method: 'BKASH'|'NAGAD'|'ROCKET'|'UPAY'|'OTHER', label, number, accountType, active }]
  "payment.methods": [],
  "payment.instructions":
    "নির্ধারিত নম্বরে Send Money করুন, তারপর ট্রানজেকশন আইডির শেষ ৪ সংখ্যা জমা দিন। অ্যাডমিন যাচাই করে অনুমোদন করলে কোর্সটি চালু হবে।",
};

// Public tracking config for the browser <Analytics> component. Never includes
// secrets (CAPI token, GA API secret) — those stay server-side.
export async function getTrackingConfig() {
  const s = await getSettings();
  return {
    metaPixelId: s["tracking.metaPixelId"] || "",
    gaMeasurementId: s["tracking.gaMeasurementId"] || "",
    gtmId: s["tracking.gtmId"] || "",
  };
}

export async function getSettings() {
  try {
    const rows = await prisma.siteSetting.findMany();
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return { ...DEFAULTS, ...map };
  } catch (err) {
    // A transient DB outage must not 500 the public pages — fall back to
    // defaults so the site still renders (logged-out, default content).
    warnThrottled("settings-db", "[settings] DB unavailable — serving default site settings.");
    return { ...DEFAULTS };
  }
}

// Public subset safe to expose without auth (no payment keys etc.).
export async function getPublicSettings() {
  return getSettings();
}

export async function updateSettings(patch) {
  const entries = Object.entries(patch ?? {});
  if (entries.length === 0) return getSettings();
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
  );
  return getSettings();
}

export { DEFAULTS as SETTING_DEFAULTS };
