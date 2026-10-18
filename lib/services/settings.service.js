import { prisma } from "@/lib/prisma";
import { warnThrottled } from "@/lib/log";

// All site settings live in the SiteSetting key/JSON table. Values may be
// strings or structured JSON (arrays of banners/videos/testimonials).
const DEFAULTS = {
  // identity + SEO
  siteName: "BCS Insight",
  tagline: "চাকরির পরীক্ষার সম্পূর্ণ প্রস্তুতি",
  logoUrl: "",
  faviconUrl: "",
  seoTitle: "BCS Insight — চাকরির পরীক্ষার প্রস্তুতি",
  seoDescription:
    "MCQ প্র্যাকটিস, টাইমড লাইভ পরীক্ষা, লিখিত মডিউল এবং ভিডিও কোর্স — এক প্ল্যাটফর্মে চাকরির পরীক্ষার সম্পূর্ণ প্রস্তুতি।",
  seoKeywords: "BCS, বিসিএস, ব্যাংক, প্রাইমারি, MCQ, লিখিত পরীক্ষা, চাকরির প্রস্তুতি",
  ogImageUrl: "",

  // hero
  heroBadge: "সরকারি চাকরির প্রস্তুতিতে আপনার বিশ্বস্ত সঙ্গী",
  heroTitle: "স্বপ্নের সরকারি চাকরির পথে",
  heroTitleAccent: "সঠিক প্রস্তুতি, সঠিক দিশা",
  heroSubtitle:
    "BCS, ব্যাংক, প্রাথমিক, শিক্ষক নিবন্ধনসহ সকল সরকারি চাকরির পরীক্ষার জন্য একটি পূর্ণাঙ্গ অনলাইন প্ল্যাটফর্ম — BCS Insight",
  heroImageUrl: "",
  heroSearchPlaceholder: "আপনি কি প্রস্তুতি নিতে চান?",
  heroCtaText: "শুরু করুন",
  heroCtaUrl: "/register",

  // hero feature chips
  "home.chips": [
    { id: "c1", label: "বিষয় ও মানসম্মত কনটেন্ট" },
    { id: "c2", label: "অভিজ্ঞ শিক্ষকদের ক্লাস" },
    { id: "c3", label: "বারবার মক টেস্ট ও বিশ্লেষণ" },
    { id: "c4", label: "সর্বশেষ সিলেবাস অনুসরণ" },
    { id: "c5", label: "মোবাইল ও ডেস্কটপে সহজে অ্যাক্সেস" },
  ],

  // stats strip
  "home.stats": [
    { id: "s1", icon: "users", value: "50,000+", label: "সফল শিক্ষার্থী" },
    { id: "s2", icon: "play", value: "500+", label: "ভিডিও ক্লাস" },
    { id: "s3", icon: "file", value: "10,000+", label: "প্র্যাকটিস MCQ" },
    { id: "s4", icon: "trophy", value: "100+", label: "মডেল টেস্ট" },
    { id: "s5", icon: "star", value: "95%", label: "শিক্ষার্থীর সন্তুষ্টি" },
  ],

  // ---- header / navigation ----
  // menu items — admins can add, rename, reorder and relink freely
  "nav.menu": [
    { id: "n1", label: "হোম", href: "/" },
    { id: "n2", label: "কোর্সসমূহ", href: "/courses" },
    { id: "n3", label: "মক টেস্ট", href: "/exams" },
    { id: "n4", label: "স্টাডি ম্যাটেরিয়ালস", href: "/practice" },
    { id: "n5", label: "লিখিত", href: "/written" },
  ],
  "header.searchPlaceholder": "কোর্স, বিষয় বা মক টেস্ট...",
  "header.loginText": "লগইন",
  "header.registerText": "রেজিস্টার",
  "header.dashboardText": "ড্যাশবোর্ড",
  "header.adminText": "অ্যাডমিন",

  // ---- footer ----
  "footer.about": "সরকারি চাকরির প্রস্তুতিতে একটি পূর্ণাঙ্গ অনলাইন লার্নিং প্ল্যাটফর্ম।",
  // link columns — [{ id, title, links: [{ id, label, href }] }]
  "footer.columns": [
    {
      id: "f1", title: "দ্রুত লিংক",
      links: [
        { id: "f1a", label: "হোম", href: "/" },
        { id: "f1b", label: "কোর্সসমূহ", href: "/courses" },
        { id: "f1c", label: "মক টেস্ট", href: "/exams" },
        { id: "f1d", label: "স্টাডি ম্যাটেরিয়ালস", href: "/practice" },
        { id: "f1e", label: "লিখিত পরীক্ষা", href: "/written" },
      ],
    },
    {
      id: "f2", title: "সহায়তা",
      links: [
        { id: "f2a", label: "ড্যাশবোর্ড", href: "/dashboard" },
        { id: "f2b", label: "ভুল খাতা", href: "/mistakes" },
        { id: "f2c", label: "প্রোফাইল", href: "/profile" },
        { id: "f2d", label: "লগইন", href: "/login" },
        { id: "f2e", label: "রেজিস্টার", href: "/register" },
      ],
    },
  ],
  "footer.contactTitle": "যোগাযোগ",
  // {year} and {siteName} are replaced when rendering
  "footer.copyright": "© {year} {siteName}. সর্বস্বত্ব সংরক্ষিত।",

  // ---- home section headings / copy ----
  "home.heroCardTitle": "দেশ গড়ার স্বপ্নে,",
  "home.heroCardAccent": "তৈরি হোন আজ থেকেই",
  "home.heroCardSubtitle": "প্রস্তুতির প্রতিটি ধাপ — এক প্ল্যাটফর্মে",
  "home.heroCardCtaText": "ফ্রি অ্যাকাউন্ট খুলুন",
  "home.heroCardCtaUrl": "/register",

  "home.coursesEyebrow": "Our Courses",
  "home.coursesTitle": "আপনার লক্ষ্যের জন্য সঠিক কোর্স",
  "home.coursesSubtitle":
    "যে পরীক্ষার প্রস্তুতি নিতে চান সেই ক্যাটাগরিতে ক্লিক করুন — ওই ক্যাটাগরির সব কোর্স দেখতে পাবেন।",
  "home.coursesAllText": "সব কোর্স দেখুন",
  "home.coursesCardCtaText": "কোর্স দেখুন",

  // feature trio — [{ id, icon, title, body, cta, href }]
  "home.features": [
    { id: "ft1", icon: "list", title: "MCQ প্র্যাকটিস", body: "বিষয়ভিত্তিক হাজারো প্রশ্ন অনলাইনে প্র্যাকটিস করুন", cta: "এখনই শুরু করুন", href: "/practice" },
    { id: "ft2", icon: "clipboard", title: "মডেল টেস্ট", body: "বাস্তব পরীক্ষার অনুকরণে নিয়মিত মডেল টেস্ট দিন", cta: "মডেল টেস্ট দিন", href: "/exams" },
    { id: "ft3", icon: "play", title: "ভিডিও ক্লাস", body: "অভিজ্ঞ শিক্ষকদের লাইভ ও রেকর্ডেড ক্লাস", cta: "ক্লাস দেখুন", href: "/courses" },
  ],

  "home.videoEyebrow": "ভিডিও",
  "home.videoTitle": "ফ্রি ক্লাস ও পরিচিতি",
  "home.reviewsEyebrow": "Student Reviews",
  "home.reviewsTitle": "আমাদের শিক্ষার্থীদের মতামত",
  "home.blogEyebrow": "From Our Blog",
  "home.blogTitle": "সর্বশেষ আর্টিকেল",
  "home.blogAllText": "সব দেখুন",
  "home.blogReadText": "পড়ুন",
  "home.newsletterTitle": "আপডেট থাকতে সাবস্ক্রাইব করুন",
  "home.newsletterSubtitle": "নতুন কোর্স, ফ্রি ক্লাস ও পরীক্ষার আপডেট পেতে আমাদের সাথে থাকুন",
  "home.newsletterPlaceholder": "আপনার ইমেইল লিখুন",
  "home.newsletterButton": "সাবস্ক্রাইব",

  // discount / promo image banners shown on the home page
  // [{ id, imageUrl, mobileImageUrl, title, subtitle, discountText, ctaText, ctaUrl, active }]
  "home.promos": [],

  // blog / article cards
  "home.blog": [],

  // contact + social (footer)
  "contact.email": "support@bcsinsight.com",
  "contact.phone": "+8801XXXXXXXXX",
  "contact.address": "ঢাকা, বাংলাদেশ",
  "social.facebook": "",
  "social.instagram": "",
  "social.youtube": "",
  "social.whatsapp": "",

  // newsletter subscribers (stored here so no extra table is needed)
  "newsletter.subscribers": [],

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
// Name + logo for the header/footer/sidebar.
export async function getBrand() {
  const s = await getSettings();
  return { siteName: s.siteName || "BCS Insight", logoUrl: s.logoUrl || "" };
}

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
