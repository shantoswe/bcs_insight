import "./globals.css";
import { Hind_Siliguri } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@/components/analytics";
import { getSettings, getTrackingConfig } from "@/lib/services/settings.service";

const hind = Hind_Siliguri({
  subsets: ["latin", "bengali"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-hind",
  display: "swap",
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Metadata comes from admin site settings so SEO is editable without a redeploy.
export async function generateMetadata() {
  let s;
  try {
    s = await getSettings();
  } catch {
    s = {};
  }
  const name = s.siteName || "AUS Prep";
  const title = s.seoTitle || `${name} — চাকরির পরীক্ষার প্রস্তুতি`;
  const description =
    s.seoDescription ||
    "MCQ প্র্যাকটিস, টাইমড লাইভ পরীক্ষা, লিখিত মডিউল এবং ভিডিও কোর্স — চাকরির পরীক্ষার সম্পূর্ণ প্রস্তুতি।";
  const ogImage = s.ogImageUrl || undefined;

  return {
    metadataBase: new URL(SITE),
    title: { default: title, template: `%s · ${name}` },
    description,
    keywords: s.seoKeywords || undefined,
    icons: s.faviconUrl ? { icon: s.faviconUrl } : undefined,
    openGraph: {
      title,
      description,
      siteName: name,
      type: "website",
      locale: "bn_BD",
      url: SITE,
      ...(ogImage && { images: [{ url: ogImage }] }),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

export const viewport = {
  themeColor: "#6d28d9",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }) {
  let tracking = { metaPixelId: "", gaMeasurementId: "", gtmId: "" };
  try {
    tracking = await getTrackingConfig();
  } catch {
    /* DB unavailable — render without trackers */
  }

  return (
    <html lang="bn" className={hind.variable}>
      <body className="font-sans antialiased min-h-screen">
        {tracking.gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${tracking.gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="gtm"
            />
          </noscript>
        )}
        {children}
        <Toaster />
        <Analytics {...tracking} />
      </body>
    </html>
  );
}
