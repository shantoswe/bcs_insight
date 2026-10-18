"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

// Image-led promotional banner for course discounts/offers.
// Admin adds these under Settings → হোমপেজ ও SEO → ডিসকাউন্ট ব্যানার.
export function PromoBanner({ promos }) {
  const items = (promos ?? []).filter((p) => p.active !== false && (p.imageUrl || p.title));
  const [i, setI] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setI((v) => (v + 1) % items.length), 7000);
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0) return null;
  const p = items[i % items.length];
  const hasText = !!(p.title || p.subtitle || p.discountText || p.ctaText);

  const Banner = (
    <div className="group relative overflow-hidden rounded-xl border bg-navy soft-shadow">
      {/* image (separate crop for phones when provided) */}
      {p.imageUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.imageUrl}
            alt={p.title || "অফার"}
            className={cn(
              "w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]",
              p.mobileImageUrl ? "hidden aspect-[3/1] sm:block" : "aspect-[16/9] sm:aspect-[3/1]"
            )}
          />
          {p.mobileImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.mobileImageUrl} alt={p.title || "অফার"} className="aspect-[4/3] w-full object-cover sm:hidden" />
          )}
        </>
      )}

      {/* text overlay — only drawn when there is copy to show */}
      {hasText && (
        <div
          className={cn(
            "flex flex-col justify-center gap-2 p-5 sm:p-7",
            p.imageUrl
              ? "absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent text-white"
              : "text-navy-foreground"
          )}
        >
          {p.discountText && (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground sm:text-sm">
              <Tag className="size-3.5" /> {p.discountText}
            </span>
          )}
          {p.title && (
            <h3 className="max-w-xl text-lg font-bold leading-snug sm:text-2xl">{p.title}</h3>
          )}
          {p.subtitle && (
            <p className="max-w-lg text-xs leading-relaxed text-white/80 sm:text-sm">{p.subtitle}</p>
          )}
          {p.ctaText && (
            <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition group-hover:brightness-110">
              {p.ctaText} <ArrowRight className="size-4" />
            </span>
          )}
        </div>
      )}
    </div>
  );

  return (
    <section className="mx-auto max-w-6xl px-4 pt-10 md:pt-12">
      <div className="relative">
        {p.ctaUrl ? <Link href={p.ctaUrl} aria-label={p.title || "অফার"}>{Banner}</Link> : Banner}

        {items.length > 1 && (
          <>
            <button
              onClick={() => setI((v) => (v - 1 + items.length) % items.length)}
              aria-label="আগের অফার"
              className="absolute left-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow transition hover:bg-white"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => setI((v) => (v + 1) % items.length)}
              aria-label="পরের অফার"
              className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow transition hover:bg-white"
            >
              <ChevronRight className="size-4" />
            </button>
            <div className="mt-3 flex justify-center gap-1.5">
              {items.map((_, k) => (
                <button
                  key={k}
                  onClick={() => setI(k)}
                  aria-label={`অফার ${k + 1}`}
                  className={cn("h-2 rounded-full transition-all", k === i % items.length ? "w-6 bg-primary" : "w-2 bg-border")}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
