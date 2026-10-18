"use client";

import { useEffect, useState } from "react";
import { Star, Quote, ChevronLeft, ChevronRight, MessageSquareQuote } from "lucide-react";
import { cn } from "@/lib/utils";

export function Testimonials({ items, heading }) {
  const h = heading ?? {};
  const reviews = items ?? [];
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(3);

  // responsive page size: 1 on phones, 2 on tablets, 3 on desktop
  useEffect(() => {
    const calc = () => setPerPage(window.innerWidth < 640 ? 1 : window.innerWidth < 1024 ? 2 : 3);
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const pages = Math.max(1, Math.ceil(reviews.length / perPage));
  useEffect(() => { if (page > pages - 1) setPage(0); }, [pages, page]);

  if (reviews.length === 0) return null;
  const start = page * perPage;
  const visible = reviews.slice(start, start + perPage);

  return (
    <section className="border-y bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            {h.eyebrow !== "" && (
              <span className="eyebrow"><MessageSquareQuote className="size-3.5" /> {h.eyebrow || "Student Reviews"}</span>
            )}
            <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
              {h.title || "আমাদের শিক্ষার্থীদের মতামত"}
            </h2>
          </div>
          {pages > 1 && (
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => (p - 1 + pages) % pages)} aria-label="আগের"
                className="flex size-9 items-center justify-center rounded-full border bg-card transition hover:border-primary/40 hover:text-primary">
                <ChevronLeft className="size-4" />
              </button>
              <button onClick={() => setPage((p) => (p + 1) % pages)} aria-label="পরের"
                className="flex size-9 items-center justify-center rounded-full border bg-card transition hover:border-primary/40 hover:text-primary">
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((r, i) => (
            <figure key={r.id ?? `${page}-${i}`} className="flex h-full flex-col rounded-xl border bg-card p-5 soft-shadow">
              <Quote className="size-6 text-primary/25" />
              <blockquote className="mt-3 flex-1 text-[0.9rem] leading-relaxed">{r.text}</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t pt-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                  {(r.name ?? "?").charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{r.name}</p>
                  {r.role && <p className="truncate text-xs text-muted-foreground">{r.role}</p>}
                  <div className="mt-1 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className={cn("size-3", j < (r.rating ?? 5) ? "fill-warning text-warning" : "text-border")} />
                    ))}
                  </div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        {pages > 1 && (
          <div className="mt-7 flex justify-center gap-1.5">
            {Array.from({ length: pages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i)} aria-label={`পৃষ্ঠা ${i + 1}`}
                className={cn("h-2 rounded-full transition-all", i === page ? "w-6 bg-primary" : "w-2 bg-border")} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
