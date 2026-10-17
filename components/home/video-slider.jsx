"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Turn a YouTube/Bunny/other URL into an embeddable src.
function toEmbed(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v"))
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    if (u.hostname === "youtu.be") return `https://www.youtube.com/embed${u.pathname}`;
    if (u.hostname.includes("youtube.com") && u.pathname.startsWith("/embed")) return url;
    // Bunny iframe embed or any other embeddable URL — use as-is
    return url;
  } catch {
    return null;
  }
}

export function VideoSlider({ videos }) {
  const items = (videos ?? []).map((v) => ({ ...v, embed: toEmbed(v.url) })).filter((v) => v.embed);
  const [active, setActive] = useState(0);

  // gentle auto-advance every 9s (pauses if only one)
  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setActive((a) => (a + 1) % items.length), 9000);
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0) return null;
  const cur = items[active];

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-secondary/12 px-3 py-1 text-sm font-semibold text-secondary">
          <PlayCircle className="size-4" /> ভিডিও
        </span>
        <h2 className="text-3xl font-bold tracking-tight">ফ্রি ক্লাস ও পরিচিতি</h2>
      </div>

      <div className="relative">
        <div className="aspect-video overflow-hidden rounded-2xl border bg-black soft-shadow">
          <iframe
            key={cur.id ?? active}
            src={cur.embed}
            title={cur.title || "video"}
            className="h-full w-full"
            allow="accelerated-2d-canvas; autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
        {cur.title && <p className="mt-3 text-center font-medium">{cur.title}</p>}

        {items.length > 1 && (
          <>
            <button
              onClick={() => setActive((a) => (a - 1 + items.length) % items.length)}
              className="absolute -left-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border bg-card shadow hover:bg-muted md:-left-5"
              aria-label="আগের ভিডিও"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={() => setActive((a) => (a + 1) % items.length)}
              className="absolute -right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border bg-card shadow hover:bg-muted md:-right-5"
              aria-label="পরের ভিডিও"
            >
              <ChevronRight className="size-5" />
            </button>
            <div className="mt-4 flex justify-center gap-2">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={cn("h-2 rounded-full transition-all", i === active ? "w-6 bg-primary" : "w-2 bg-border")}
                  aria-label={`ভিডিও ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
