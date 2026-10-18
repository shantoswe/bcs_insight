import Link from "next/link";
import {
  Users, ListChecks, ClipboardList, PlayCircle, PenLine, TrendingUp, ArrowRight, Wallet,
} from "lucide-react";
import { requireStaff } from "@/lib/auth/session";
import { adminStats } from "@/lib/services/stats.service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboard() {
  await requireStaff("dashboard");
  const s = await adminStats();

  const cards = [
    { label: "মোট ইউজার", value: s.users, icon: Users, tone: "bg-primary/12 text-primary" },
    { label: "প্রশ্ন", value: s.questions, icon: ListChecks, tone: "bg-accent/15 text-accent-foreground" },
    { label: "পরীক্ষা", value: s.exams, icon: ClipboardList, tone: "bg-secondary/15 text-secondary" },
    { label: "কোর্স", value: s.courses, icon: PlayCircle, tone: "bg-warning/12 text-warning" },
    { label: "সম্পন্ন পরীক্ষা", value: s.attempts, icon: TrendingUp, tone: "bg-primary/12 text-primary" },
    { label: "মূল্যায়ন বাকি", value: s.writtenPending, icon: PenLine, tone: "bg-destructive/12 text-destructive" },
    { label: "পেমেন্ট বাকি", value: s.paymentsPending, icon: Wallet, tone: "bg-secondary/15 text-secondary" },
  ];

  const shortcuts = [
    { href: "/admin/questions", label: "প্রশ্ন যোগ / বাল্ক আপলোড" },
    { href: "/admin/exams", label: "নতুন পরীক্ষা তৈরি" },
    { href: "/admin/written", label: "লিখিত পরীক্ষা ও মূল্যায়ন" },
    { href: "/admin/courses", label: "কোর্স ও ভিডিও লেসন" },
    { href: "/admin/payments", label: "পেমেন্ট অনুমোদন" },
  ];

  return (
    <div className="p-5 lg:p-8">
      <h1 className="text-2xl font-bold">অ্যাডমিন ড্যাশবোর্ড</h1>
      <p className="text-muted-foreground">প্ল্যাটফর্মের সারসংক্ষেপ।</p>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-5">
              <span className={`flex size-10 items-center justify-center rounded-xl ${c.tone}`}>
                <c.icon className="size-5" />
              </span>
              <p className="mt-3 text-2xl font-bold">{c.value}</p>
              <p className="text-sm text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">দ্রুত কাজ</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {shortcuts.map((sc) => (
          <Link key={sc.href} href={sc.href}>
            <Card className="transition-colors hover:border-primary/40">
              <CardContent className="flex items-center justify-between p-4">
                <span className="font-medium">{sc.label}</span>
                <ArrowRight className="size-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {(s.writtenPending > 0 || s.paymentsPending > 0) && (
        <div className="mt-6 flex flex-wrap gap-2">
          {s.writtenPending > 0 && <Badge variant="destructive">{s.writtenPending}টি লিখিত উত্তর মূল্যায়নের অপেক্ষায়</Badge>}
          {s.paymentsPending > 0 && <Badge variant="warning">{s.paymentsPending}টি পেমেন্ট অনুমোদনের অপেক্ষায়</Badge>}
        </div>
      )}
    </div>
  );
}
