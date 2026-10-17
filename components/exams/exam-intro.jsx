"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BookOpen, Clock, FileText, Award, AlertTriangle, ArrowLeft, Loader2, PlayCircle } from "lucide-react";
import { post } from "@/lib/client-api";
import { toBn, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ExamIntro({ exam }) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  const durH = Math.floor(exam.durationMinutes / 60);
  const durM = exam.durationMinutes % 60;
  const durStr = durH > 0 ? `${toBn(durH)} ঘণ্টা${durM ? " " + toBn(durM) + " মিনিট" : ""}` : `${toBn(durM)} মিনিট`;

  async function start() {
    setStarting(true);
    try {
      const { attemptId } = await post(`/api/v1/exams/${exam.id}/start`, {});
      router.push(`/attempts/${attemptId}`);
    } catch (e) {
      toast.error(e.message);
      setStarting(false);
    }
  }

  if (exam.done && exam.attemptId) {
    return (
      <Card>
        <CardContent className="space-y-4 py-10 text-center">
          <Award className="mx-auto size-10 text-primary" />
          <h2 className="text-xl font-bold">আপনি এই পরীক্ষা দিয়েছেন</h2>
          <div className="flex justify-center gap-2">
            <Button asChild><Link href={`/attempts/${exam.attemptId}/result`}>ফলাফল দেখুন</Link></Button>
            <Button asChild variant="outline"><Link href="/exams">আরও পরীক্ষা</Link></Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (exam.notStarted) {
    return (
      <Card>
        <CardContent className="space-y-3 py-10 text-center">
          <Clock className="mx-auto size-10 text-primary" />
          <h2 className="text-xl font-bold">পরীক্ষা এখনো শুরু হয়নি</h2>
          <p className="text-muted-foreground">{formatDateTime(exam.startAt)}-এ শুরু হবে</p>
          <Button asChild variant="outline"><Link href="/exams"><ArrowLeft className="size-4" /> পরীক্ষার তালিকা</Link></Button>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    { label: "প্রশ্ন", value: toBn(exam.questionCount) },
    { label: "সময়", value: durStr },
    { label: "মোট নম্বর", value: toBn(exam.totalMarks) },
    { label: "নেগেটিভ মার্কিং", value: exam.negativeMarking > 0 ? `−${toBn(exam.negativeMarking)}` : "নেই", warn: exam.negativeMarking > 0 },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="brand-gradient px-6 py-8 text-center text-white">
        <span className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-white/20">
          <BookOpen className="size-7" />
        </span>
        <Badge className="mb-2 bg-white/20 text-white">{exam.type === "LIVE" ? "লাইভ পরীক্ষা" : exam.ended ? "আর্কাইভ প্র্যাকটিস" : "প্র্যাকটিস"}</Badge>
        <h1 className="text-xl font-bold">{exam.titleBn || exam.titleEn}</h1>
      </div>

      <CardContent className="space-y-5 p-6">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.label} className={`rounded-xl border p-3 text-center ${s.warn ? "border-secondary/30 bg-secondary/8" : "bg-background"}`}>
              <p className={`text-xl font-bold ${s.warn ? "text-secondary" : ""}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 text-sm">
          <p className="mb-2 font-semibold text-primary">নির্দেশনা:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• একটি প্রশ্নের উত্তর দেওয়ার পর আর পরিবর্তন করা যাবে না।</li>
            <li>• সময় শেষ হলে স্বয়ংক্রিয়ভাবে জমা হবে।</li>
            {exam.negativeMarking > 0 && <li className="text-secondary">• প্রতিটি ভুল উত্তরে {toBn(exam.negativeMarking)} নম্বর কাটা যাবে।</li>}
          </ul>
        </div>

        <div className="flex gap-3">
          <Button asChild variant="outline" className="flex-1"><Link href="/exams">ফিরে যান</Link></Button>
          <Button className="flex-1" onClick={start} disabled={starting}>
            {starting ? <Loader2 className="size-4 animate-spin" /> : <PlayCircle className="size-4" />}
            {exam.inProgress ? "চালিয়ে যান" : "শুরু করুন"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
