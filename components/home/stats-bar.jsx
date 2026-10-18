import { Users, PlayCircle, FileText, Trophy, Star } from "lucide-react";

const ICONS = { users: Users, play: PlayCircle, file: FileText, trophy: Trophy, star: Star };
// muted tints — colour marks the metric without shouting
const TONES = [
  "bg-[oklch(0.95_0.04_245)] text-[oklch(0.45_0.12_245)]",
  "bg-[oklch(0.95_0.04_25)] text-[oklch(0.50_0.16_25)]",
  "bg-primary/10 text-primary",
  "bg-[oklch(0.95_0.05_72)] text-[oklch(0.48_0.11_72)]",
  "bg-[oklch(0.96_0.05_95)] text-[oklch(0.50_0.11_95)]",
];

export function StatsBar({ stats }) {
  const items = stats ?? [];
  if (items.length === 0) return null;

  return (
    <section className="border-b bg-card">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-6 px-4 py-7 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((s, i) => {
          const Icon = ICONS[s.icon] ?? Star;
          return (
            <div key={s.id ?? i} className="flex items-center gap-3">
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${TONES[i % TONES.length]}`}>
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-lg font-bold leading-none">{s.value}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
