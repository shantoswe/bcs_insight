import Link from "next/link";
import {
  ClipboardList, PenLine, PlayCircle, Bookmark, TrendingUp, Trophy, ArrowRight, Target,
} from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { studentDashboard } from "@/lib/services/stats.service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "ড্যাশবোর্ড" };

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await studentDashboard(user.id);

  const metrics = [
    { icon: ClipboardList, label: "পরীক্ষা দিয়েছেন", value: data.examsTaken, tone: "bg-primary/12 text-primary" },
    { icon: TrendingUp, label: "গড় স্কোর", value: `${data.avgPercent}%`, tone: "bg-accent/15 text-accent-foreground" },
    { icon: PlayCircle, label: "কোর্স", value: data.enrollments, tone: "bg-secondary/15 text-secondary" },
    { icon: Bookmark, label: "ভুল খাতা", value: data.bookmarks, tone: "bg-[oklch(0.78_0.16_75_/_0.2)] text-[oklch(0.45_0.12_70)]" },
  ];

  const quick = [
    { href: "/exams", icon: ClipboardList, label: "পরীক্ষা দিন" },
    { href: "/practice", icon: Target, label: "প্র্যাকটিস" },
    { href: "/written", icon: PenLine, label: "লিখিত" },
    { href: "/courses", icon: PlayCircle, label: "কোর্স" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">স্বাগতম, {user.nameBn || user.name}!</h1>
          <p className="text-muted-foreground">আজ আপনার প্রস্তুতি চালিয়ে যান।</p>
        </div>
        {user.targetExam && <Badge variant="secondary">লক্ষ্য: {user.targetExam}</Badge>}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-5">
              <span className={`flex size-10 items-center justify-center rounded-xl ${m.tone}`}>
                <m.icon className="size-5" />
              </span>
              <p className="mt-3 text-2xl font-bold">{m.value}</p>
              <p className="text-sm text-muted-foreground">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        {quick.map((q) => (
          <Button key={q.href} asChild variant="outline" className="h-auto justify-start py-3">
            <Link href={q.href}>
              <q.icon className="size-4" /> {q.label}
            </Link>
          </Button>
        ))}
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">সাম্প্রতিক পরীক্ষা</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/exams">সব দেখুন <ArrowRight className="size-4" /></Link>
          </Button>
        </div>

        {data.recent.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              এখনো কোনো পরীক্ষা দেননি।{" "}
              <Link href="/exams" className="font-medium text-primary hover:underline">শুরু করুন</Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {data.recent.map((r) => {
              const pct = r.total ? Math.round((r.score / r.total) * 100) : 0;
              return (
                <Link key={r.id} href={`/attempts/${r.id}/result`}>
                  <Card className="transition-colors hover:border-primary/40">
                    <CardContent className="flex items-center gap-4 p-4">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                        {pct}%
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{r.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.score}/{r.total} · {r.correct} সঠিক · {r.wrong} ভুল · {formatDateTime(r.submittedAt)}
                        </p>
                      </div>
                      {r.rank != null && (
                        <Badge variant="secondary" className="shrink-0">
                          <Trophy className="mr-1 size-3" /> #{r.rank}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
