import Link from "next/link";
import {
  GraduationCap, Timer, PenLine, PlayCircle, ClipboardList,
  Trophy, ArrowRight, CheckCircle2, BookOpenCheck,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/services/settings.service";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { BannerStrip } from "@/components/home/banner-strip";
import { VideoSlider } from "@/components/home/video-slider";
import { Testimonials } from "@/components/home/testimonials";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  { icon: ClipboardList, title: "MCQ প্র্যাকটিস", body: "বিষয় ও টপিক ধরে অনুশীলন — সঙ্গে সঙ্গে সঠিক উত্তর ও ব্যাখ্যা।", color: "bg-primary/12 text-primary" },
  { icon: Timer, title: "টাইমড লাইভ পরীক্ষা", body: "কাউন্টডাউন টাইমার, অটো-সাবমিট, তাৎক্ষণিক স্কোর ও মেধাতালিকা।", color: "bg-secondary/15 text-secondary" },
  { icon: PenLine, title: "লিখিত মডিউল", body: "উত্তরপত্র আপলোড করুন, মডেল উত্তর ও মূল্যায়কের PDF মার্কিং ও ভয়েস ফিডব্যাক পান।", color: "bg-accent/15 text-accent-foreground" },
  { icon: PlayCircle, title: "ভিডিও কোর্স", body: "Bunny Stream-এ HD ভিডিও ক্লাস, লেসন-ভিত্তিক অগ্রগতি ট্র্যাকিং।", color: "bg-[oklch(0.78_0.16_75_/_0.2)] text-[oklch(0.45_0.12_70)]" },
];

const STATS = [
  ["10,000+", "প্র্যাকটিস প্রশ্ন"],
  ["সাপ্তাহিক", "লাইভ মক টেস্ট"],
  ["HD", "ভিডিও ক্লাস"],
  ["মেধা", "তালিকা র‍্যাঙ্কিং"],
];

export default async function HomePage() {
  const user = await getCurrentUser();
  const settings = await getSettings();
  const heroPoints = (settings["home.hero.points"] || "").split("\n").filter((p) => p.trim());

  return (
    <div className="flex min-h-screen flex-col">
      <BannerStrip banners={settings["home.banners"]} />
      <SiteHeader user={user} />

      {/* Hero */}
      <section className="brand-gradient-soft relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <Badge className="mb-4">
              <BookOpenCheck className="mr-1 size-3.5" /> {settings.heroBadge}
            </Badge>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              {settings.heroTitle}
            </h1>
            <p className="mt-4 max-w-md text-lg text-muted-foreground">{settings.heroSubtitle}</p>

            {heroPoints.length > 0 && (
              <ul className="mt-5 space-y-1.5">
                {heroPoints.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-accent" /> {p}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={user ? "/dashboard" : settings.heroCtaUrl || "/register"}>
                  {settings.heroCtaText || "শুরু করুন"} <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/exams">পরীক্ষা দেখুন</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl border bg-card p-6 soft-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-lg brand-gradient text-white">
                    <Timer className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">47th BCS মক টেস্ট</p>
                    <p className="text-xs text-muted-foreground">100 প্রশ্ন · 60 মিনিট</p>
                  </div>
                </div>
                <Badge variant="secondary">লাইভ</Badge>
              </div>
              <div className="mt-5 space-y-3">
                {["বাংলা সাহিত্য", "আন্তর্জাতিক বিষয়াবলি", "গাণিতিক যুক্তি"].map((sub, i) => (
                  <div key={sub} className="flex items-center justify-between rounded-lg border bg-background px-3 py-2.5">
                    <span className="text-sm">{sub}</span>
                    <Badge variant={i === 0 ? "success" : "outline"}>{i === 0 ? "সম্পন্ন" : "বাকি"}</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between rounded-xl brand-gradient px-4 py-3 text-white">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Trophy className="size-4" /> আপনার র‍্যাঙ্ক
                </span>
                <span className="text-lg font-bold">#12</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4">
          {STATS.map(([big, small]) => (
            <div key={small} className="text-center">
              <p className="text-2xl font-bold text-gradient md:text-3xl">{big}</p>
              <p className="mt-1 text-sm text-muted-foreground">{small}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Video slider (from admin settings) */}
      <VideoSlider videos={settings["home.videos"]} />

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">এক প্ল্যাটফর্মে সবকিছু</h2>
          <p className="mt-3 text-muted-foreground">
            প্রশ্ন অনুশীলন থেকে লাইভ পরীক্ষা, লিখিত মূল্যায়ন আর ভিডিও ক্লাস — প্রস্তুতির প্রতিটি ধাপ।
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6 soft-shadow transition-transform hover:-translate-y-1">
              <span className={`flex size-11 items-center justify-center rounded-xl ${f.color}`}>
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials / reviews (from admin settings) */}
      <Testimonials items={settings["home.testimonials"]} />

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="brand-gradient relative overflow-hidden rounded-3xl px-8 py-14 text-center text-white">
          <GraduationCap className="mx-auto mb-4 size-12 opacity-90" />
          <h2 className="text-3xl font-bold">আজই প্রস্তুতি শুরু করুন</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/85">
            বিনামূল্যে অ্যাকাউন্ট খুলুন — হাজারো প্রশ্ন, সাপ্তাহিক মক টেস্ট আর ভিডিও ক্লাসে অ্যাক্সেস পান।
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-7 bg-white text-primary hover:bg-white">
            <Link href={user ? "/dashboard" : "/register"}>
              ফ্রি রেজিস্টার করুন <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
