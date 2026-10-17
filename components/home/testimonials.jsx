"use client";

import { useEffect, useState } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Testimonials({ items }) {
  const reviews = items ?? [];
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reviews.length <= 1) return;
    const t = setInterval(() => setActive((a) => (a + 1) % reviews.length), 7000);
    return () => clearInterval(t);
  }, [reviews.length]);

  if (reviews.length === 0) return null;

  return (
    <section className="brand-gradient-soft">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">শিক্ষার্থীদের অভিজ্ঞতা</h2>
          <p className="mt-2 text-muted-foreground">যারা আমাদের সাথে প্রস্তুতি নিয়েছেন</p>
        </div>

        <div className="relative overflow-hidden">
          <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${active * 100}%)` }}>
            {reviews.map((r, i) => (
              <div key={r.id ?? i} className="w-full shrink-0 px-2">
                <div className="mx-auto max-w-2xl rounded-2xl border bg-card p-8 text-center soft-shadow">
                  <Quote className="mx-auto mb-3 size-8 text-primary/30" />
                  <div className="mb-3 flex justify-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className={cn("size-4", j < (r.rating ?? 5) ? "fill-[oklch(0.8_0.15_85)] text-[oklch(0.8_0.15_85)]" : "text-border")} />
                    ))}
                  </div>
                  <p className="text-lg leading-relaxed">“{r.text}”</p>
                  <div className="mt-5 flex items-center justify-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-full brand-gradient font-bold text-white">
                      {(r.name ?? "?").charAt(0)}
                    </span>
                    <div className="text-left">
                      <p className="font-semibold">{r.name}</p>
                      {r.role && <p className="text-sm text-muted-foreground">{r.role}</p>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {reviews.length > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button onClick={() => setActive((a) => (a - 1 + reviews.length) % reviews.length)} className="flex size-9 items-center justify-center rounded-full border bg-card hover:bg-muted"><ChevronLeft className="size-4" /></button>
              <div className="flex gap-1.5">
                {reviews.map((_, i) => (
                  <button key={i} onClick={() => setActive(i)} className={cn("h-2 rounded-full transition-all", i === active ? "w-6 bg-primary" : "w-2 bg-border")} />
                ))}
              </div>
              <button onClick={() => setActive((a) => (a + 1) % reviews.length)} className="flex size-9 items-center justify-center rounded-full border bg-card hover:bg-muted"><ChevronRight className="size-4" /></button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
