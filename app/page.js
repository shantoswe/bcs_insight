import { getCurrentUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/services/settings.service";
import { listHomeCategories } from "@/lib/services/taxonomy.service";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { BannerStrip } from "@/components/home/banner-strip";
import { Hero } from "@/components/home/hero";
import { StatsBar } from "@/components/home/stats-bar";
import { PromoBanner } from "@/components/home/promo-banner";
import { CourseCards } from "@/components/home/course-cards";
import { FeatureTrio } from "@/components/home/feature-trio";
import { VideoSlider } from "@/components/home/video-slider";
import { Testimonials } from "@/components/home/testimonials";
import { BlogSection } from "@/components/home/blog-section";
import { Newsletter } from "@/components/home/newsletter";

export default async function HomePage() {
  const user = await getCurrentUser();
  const settings = await getSettings();
  let categories = [];
  try { categories = await listHomeCategories(); } catch {}
  const brand = { siteName: settings.siteName, logoUrl: settings.logoUrl };

  return (
    <div className="flex min-h-screen flex-col">
      <BannerStrip banners={settings["home.banners"]} />
      <SiteHeader user={user} brand={brand} settings={settings} />

      <main className="flex-1">
        <Hero settings={settings} />
        <StatsBar stats={settings["home.stats"]} />
        <PromoBanner promos={settings["home.promos"]} />
        <CourseCards
          categories={categories}
          copy={{
            eyebrow: settings["home.coursesEyebrow"],
            title: settings["home.coursesTitle"],
            subtitle: settings["home.coursesSubtitle"],
            allText: settings["home.coursesAllText"],
            cardCtaText: settings["home.coursesCardCtaText"],
          }}
        />
        <FeatureTrio features={settings["home.features"]} />
        <VideoSlider videos={settings["home.videos"]} heading={{ eyebrow: settings["home.videoEyebrow"], title: settings["home.videoTitle"] }} />
        <Testimonials items={settings["home.testimonials"]} heading={{ eyebrow: settings["home.reviewsEyebrow"], title: settings["home.reviewsTitle"] }} />
        <BlogSection
          posts={settings["home.blog"]}
          heading={{
            eyebrow: settings["home.blogEyebrow"],
            title: settings["home.blogTitle"],
            allText: settings["home.blogAllText"],
            readText: settings["home.blogReadText"],
          }}
        />
        <Newsletter
          copy={{
            title: settings["home.newsletterTitle"],
            subtitle: settings["home.newsletterSubtitle"],
            placeholder: settings["home.newsletterPlaceholder"],
            button: settings["home.newsletterButton"],
          }}
        />
      </main>

      <SiteFooter brand={brand} settings={settings} />
    </div>
  );
}
