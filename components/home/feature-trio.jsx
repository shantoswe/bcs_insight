import Link from "next/link";
import {
  ArrowRight, ListChecks, ClipboardCheck, PlayCircle, BookOpen, Trophy, Users, FileText,
} from "lucide-react";

const ICONS = {
  list: ListChecks, clipboard: ClipboardCheck, play: PlayCircle,
  book: BookOpen, trophy: Trophy, users: Users, file: FileText,
};
const TONES = [
  "bg-[oklch(0.95_0.04_245)] text-[oklch(0.45_0.12_245)]",
  "bg-primary/10 text-primary",
  "bg-[oklch(0.95_0.045_300)] text-[oklch(0.46_0.13_300)]",
];

// Fully editable in admin → হোমপেজ ও SEO → ফিচার কার্ড.
export function FeatureTrio({ features }) {
  const items = features ?? [];
  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-14 md:pb-16">
      <div className="grid gap-5 md:grid-cols-3">
        {items.map((f, i) => {
          const Icon = ICONS[f.icon] ?? ListChecks;
          return (
            <div key={f.id ?? i} className="rounded-xl border bg-card p-5 soft-shadow">
              <span className={`flex size-11 items-center justify-center rounded-xl ${TONES[i % TONES.length]}`}>
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 font-bold">{f.title}</h3>
              {f.body && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>}
              {f.cta && (
                <Link href={f.href || "#"} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                  {f.cta} <ArrowRight className="size-4" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
