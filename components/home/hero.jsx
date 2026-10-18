"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, ShieldCheck, BookOpenCheck, Users, Target, CalendarCheck, Smartphone, GraduationCap,
} from "lucide-react";

const CHIP_ICONS = [BookOpenCheck, Users, Target, CalendarCheck, Smartphone];

export function Hero({ settings }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const chips = settings["home.chips"] ?? [];

  function submit(e) {
    e.preventDefault();
    router.push(q.trim() ? `/courses?q=${encodeURIComponent(q.trim())}` : "/courses");
  }

  return (
    <section className="hero-wash border-b">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-12 md:pb-14 md:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          {/* copy */}
          <div>
            {settings.heroBadge && (
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1.5 text-xs font-semibold text-primary md:text-sm">
                <ShieldCheck className="size-4 shrink-0" />
                {settings.heroBadge}
              </span>
            )}

            <h1 className="mt-5 text-[1.9rem] font-bold leading-[1.28] tracking-tight sm:text-4xl lg:text-[2.7rem]">
              {settings.heroTitle}
              {settings.heroTitleAccent && (
                <>
                  <br />
                  <span className="text-primary">{settings.heroTitleAccent}</span>
                </>
              )}
            </h1>

            <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-muted-foreground md:text-base">
              {settings.heroSubtitle}
            </p>

            {/* search */}
            <form onSubmit={submit} className="mt-6 flex max-w-xl items-center gap-2 rounded-xl border bg-card p-1.5 soft-shadow">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={settings.heroSearchPlaceholder || "আপনি কি প্রস্তুতি নিতে চান?"}
                aria-label="কোর্স খুঁজুন"
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition hover:brightness-110"
                aria-label="খুঁজুন"
              >
                <Search className="size-4" />
              </button>
            </form>
          </div>

          {/* visual */}
          <div className="relative">
            {settings.heroImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.heroImageUrl}
                alt=""
                className="w-full rounded-2xl object-cover lift-shadow"
              />
            ) : (
              <HeroFallback settings={settings} />
            )}
          </div>
        </div>

        {/* feature chips */}
        {chips.length > 0 && (
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {chips.map((c, i) => {
              const Icon = CHIP_ICONS[i % CHIP_ICONS.length];
              return (
                <li key={c.id ?? i} className="flex items-center gap-2.5 rounded-xl border bg-card px-3 py-2.5 soft-shadow">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <span className="text-[0.78rem] font-medium leading-snug">{c.label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

// Shown until an admin uploads a hero image (Settings → হোমপেজ ও SEO).
function HeroFallback({ settings }) {
  const s = settings ?? {};
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card p-8 text-center lift-shadow">
      <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/8" />
      <div className="pointer-events-none absolute -bottom-20 -left-12 size-56 rounded-full bg-primary/5" />
      <div className="relative">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <GraduationCap className="size-8" />
        </span>
        <p className="mt-5 text-xl font-bold leading-snug">
          {s["home.heroCardTitle"] ?? "দেশ গড়ার স্বপ্নে,"}
          <br />
          <span className="text-primary">{s["home.heroCardAccent"] ?? "তৈরি হোন আজ থেকেই"}</span>
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          {s["home.heroCardSubtitle"] ?? "প্রস্তুতির প্রতিটি ধাপ — এক প্ল্যাটফর্মে"}
        </p>
        <Link
          href={s["home.heroCardCtaUrl"] || "/register"}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
        >
          {s["home.heroCardCtaText"] || "ফ্রি অ্যাকাউন্ট খুলুন"}
        </Link>
      </div>
    </div>
  );
}
