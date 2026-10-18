import Link from "next/link";
import { ArrowRight, Check, GraduationCap, BookMarked, Layers } from "lucide-react";

// Header tone per category (set in admin → বিষয় ও টপিক → ক্যাটাগরি)
const TONES = {
  navy: "bg-navy",
  blue: "bg-[oklch(0.42_0.13_250)]",
  maroon: "bg-[oklch(0.40_0.13_10)]",
  amber: "bg-[oklch(0.48_0.12_60)]",
  green: "bg-[oklch(0.42_0.10_163)]",
};

const DEFAULT_POINTS = [
  "সম্পূর্ণ সিলেবাস কভারেজ",
  "ভিডিও ক্লাস + নোট",
  "বিষয়ভিত্তিক MCQ",
  "মডেল টেস্ট ও পূর্ববর্তী প্রশ্ন",
];

// One card per course category. Clicking a card opens every course in that
// category. Categories come straight from the database.
export function CourseCards({ categories, copy }) {
  const items = categories ?? [];
  const c = copy ?? {};
  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-14 md:py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          {c.eyebrow !== "" && (
            <span className="eyebrow"><BookMarked className="size-3.5" /> {c.eyebrow || "Our Courses"}</span>
          )}
          <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
            {c.title || "আপনার লক্ষ্যের জন্য সঠিক কোর্স"}
          </h2>
          {c.subtitle !== "" && (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {c.subtitle || "যে পরীক্ষার প্রস্তুতি নিতে চান সেই ক্যাটাগরিতে ক্লিক করুন — ওই ক্যাটাগরির সব কোর্স দেখতে পাবেন।"}
            </p>
          )}
        </div>
        <Link
          href="/courses"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-semibold transition hover:border-primary/40 hover:text-primary"
        >
          {c.allText || "সব কোর্স দেখুন"} <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((c) => {
          const points = c.highlights?.length ? c.highlights : DEFAULT_POINTS;
          return (
            <Link
              key={c.id}
              href={`/courses?category=${c.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border bg-card soft-shadow transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className={`relative flex h-28 items-end p-4 ${TONES[c.color] ?? TONES.navy}`}>
                {c.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt="" className="absolute inset-0 size-full object-cover opacity-45" />
                )}
                <GraduationCap className="pointer-events-none absolute right-3 top-3 size-10 text-white/15" />
                <div className="relative">
                  <h3 className="text-lg font-bold leading-snug text-white">{c.nameBn || c.nameEn}</h3>
                  <p className="mt-0.5 flex items-center gap-1 text-[0.7rem] text-white/75">
                    <Layers className="size-3" /> {c.courseCount}টি কোর্স
                  </p>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <ul className="space-y-2">
                  {points.slice(0, 4).map((p, k) => (
                    <li key={k} className="flex items-start gap-2 text-[0.82rem] leading-snug">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                <span className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-lg border border-primary/30 px-4 py-2 text-sm font-semibold text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  {c.cardCtaText || "কোর্স দেখুন"} <ArrowRight className="size-4" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
