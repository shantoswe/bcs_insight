"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone, X } from "lucide-react";

const COLORS = {
  primary: "bg-primary text-primary-foreground",
  coral: "bg-secondary text-secondary-foreground",
  emerald: "bg-accent text-accent-foreground",
  gold: "bg-[oklch(0.8_0.15_85)] text-[oklch(0.3_0.08_85)]",
};

// Rotating announcement strip across the top of the home page.
export function BannerStrip({ banners }) {
  const active = (banners ?? []).filter((b) => b.active !== false);
  const [idx, setIdx] = useState(0);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (active.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % active.length), 6000);
    return () => clearInterval(t);
  }, [active.length]);

  if (closed || active.length === 0) return null;
  const b = active[idx % active.length];
  const cls = COLORS[b.color] || COLORS.primary;

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 ${cls}`}>
      <Megaphone className="size-4 shrink-0 opacity-90" />
      <div className="min-w-0 flex-1 text-sm">
        {b.title && <span className="mr-2 font-bold">{b.title}</span>}
        {b.body && <span className="opacity-90">{b.body}</span>}
      </div>
      {b.ctaText && b.ctaUrl && (
        <Link href={b.ctaUrl} className="shrink-0 whitespace-nowrap rounded-lg border border-current/40 px-3 py-1 text-xs font-bold hover:bg-white/15">
          {b.ctaText}
        </Link>
      )}
      <button onClick={() => setClosed(true)} className="shrink-0 opacity-80 hover:opacity-100" aria-label="বন্ধ করুন">
        <X className="size-4" />
      </button>
    </div>
  );
}
