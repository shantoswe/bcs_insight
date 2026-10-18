import Link from "next/link";
import { ArrowRight, Newspaper, CalendarDays } from "lucide-react";

export function BlogSection({ posts, heading }) {
  const h = heading ?? {};
  const items = posts ?? [];
  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 md:py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          {h.eyebrow !== "" && (
            <span className="eyebrow"><Newspaper className="size-3.5" /> {h.eyebrow || "From Our Blog"}</span>
          )}
          <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{h.title || "সর্বশেষ আর্টিকেল"}</h2>
        </div>
        {items[0]?.indexUrl && (
          <Link href={items[0].indexUrl} className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-semibold transition hover:border-primary/40 hover:text-primary">
            {h.allText || "সব দেখুন"} <ArrowRight className="size-4" />
          </Link>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p, i) => (
          <article key={p.id ?? i} className="flex flex-col overflow-hidden rounded-xl border bg-card soft-shadow transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="aspect-[16/9] bg-muted">
              {p.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt="" className="size-full object-cover" />
              )}
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="font-semibold leading-snug">{p.title}</h3>
              {p.date && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5" /> {p.date}
                </p>
              )}
              <Link href={p.url || "#"} className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-primary hover:underline">
                {h.readText || "পড়ুন"} <ArrowRight className="size-4" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
