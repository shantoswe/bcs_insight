"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Loader2, Trophy, CheckCircle2, XCircle, MinusCircle, Clock, Award, Bookmark, Home,
} from "lucide-react";
import { get, post } from "@/lib/client-api";
import { cn, clock, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MathText } from "@/components/ui/math-text";

export function ResultView({ attemptId }) {
  const [state, setState] = useState({ loading: true, data: null, sealed: false });

  useEffect(() => {
    (async () => {
      try {
        const data = await get(`/api/v1/attempts/${attemptId}/result`);
        setState({ loading: false, data, sealed: false });
      } catch (e) {
        if (e.status === 403) setState({ loading: false, data: null, sealed: true });
        else {
          toast.error(e.message);
          setState({ loading: false, data: null, sealed: false });
        }
      }
    })();
  }, [attemptId]);

  if (state.loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );

  if (state.sealed)
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Clock className="mx-auto size-10 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-bold">ফলাফল এখনো প্রকাশিত হয়নি</h2>
          <p className="mt-2 text-muted-foreground">
            লাইভ পরীক্ষার সময় শেষ হলে মেধাতালিকা প্রকাশিত হবে। পরে আবার দেখুন।
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/dashboard">ড্যাশবোর্ডে ফিরুন</Link>
          </Button>
        </CardContent>
      </Card>
    );

  if (!state.data) return null;

  const { result, review, attempt } = state.data;
  const percent = result.totalMarks ? Math.round((result.score / result.totalMarks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* headline */}
      <Card className="overflow-hidden">
        <div className="brand-gradient px-6 py-8 text-center text-white">
          <p className="text-sm opacity-90">{attempt.exam.titleBn || attempt.exam.titleEn}</p>
          <div className="mt-2 flex items-end justify-center gap-1">
            <span className="text-5xl font-bold">{result.score}</span>
            <span className="pb-1 text-xl opacity-80">/ {result.totalMarks}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <Badge className="bg-white/20 text-white">{percent}%</Badge>
            {result.passed ? (
              <Badge className="bg-white/20 text-white">উত্তীর্ণ</Badge>
            ) : (
              <Badge className="bg-white/20 text-white">অনুত্তীর্ণ</Badge>
            )}
            {result.rank != null && (
              <Badge className="bg-white/20 text-white">
                <Trophy className="mr-1 size-3.5" /> র‍্যাঙ্ক #{result.rank}
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
          <Stat icon={CheckCircle2} tone="text-accent" label="সঠিক" value={result.correctCount} />
          <Stat icon={XCircle} tone="text-destructive" label="ভুল" value={result.wrongCount} />
          <Stat icon={MinusCircle} tone="text-muted-foreground" label="বাদ" value={result.skippedCount} />
          <Stat icon={Clock} tone="text-primary" label="সময়" value={formatDuration(result.timeTakenSeconds)} />
        </CardContent>
        {result.negativeMarks > 0 && (
          <div className="border-t px-5 py-3 text-center text-sm text-muted-foreground">
            নেগেটিভ মার্কিং: −{result.negativeMarks}
            {result.tabSwitchCount > 0 && ` · ট্যাব পরিবর্তন: ${result.tabSwitchCount}`}
          </div>
        )}
      </Card>

      <Tabs defaultValue="breakdown">
        <TabsList className="w-full">
          <TabsTrigger value="breakdown" className="flex-1">বিষয়ভিত্তিক</TabsTrigger>
          <TabsTrigger value="review" className="flex-1">উত্তর পর্যালোচনা</TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex-1">মেধাতালিকা</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown">
          <SubjectBreakdown breakdown={result.subjectBreakdown} review={review} />
        </TabsContent>

        <TabsContent value="review">
          <ReviewList review={review} />
        </TabsContent>

        <TabsContent value="leaderboard">
          <Leaderboard examId={attempt.examId} />
        </TabsContent>
      </Tabs>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/exams"><Home className="size-4" /> আরও পরীক্ষা</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/mistakes"><Bookmark className="size-4" /> ভুল খাতা</Link>
        </Button>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, tone, label, value }) {
  return (
    <div className="rounded-xl border bg-background p-3 text-center">
      <Icon className={cn("mx-auto size-5", tone)} />
      <p className="mt-1.5 text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function SubjectBreakdown({ breakdown, review }) {
  if (!breakdown?.length)
    return <p className="py-8 text-center text-muted-foreground">কোনো তথ্য নেই।</p>;

  // map subjectId → name using the reviewed questions
  const names = new Map();
  for (const q of review ?? []) if (q.subject?.id) names.set(q.subject.id, q.subject.nameBn || q.subject.nameEn);

  return (
    <div className="space-y-3">
      {breakdown.map((b) => {
        const attempted = b.correct + b.wrong;
        const total = attempted + b.skipped;
        const pct = total ? Math.round((b.correct / total) * 100) : 0;
        return (
          <Card key={b.subjectId}>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium">{names.get(b.subjectId) ?? "বিষয়"}</span>
                <span className="text-muted-foreground">
                  {b.correct} সঠিক · {b.wrong} ভুল · {b.skipped} বাদ
                </span>
              </div>
              <Progress value={pct} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ReviewList({ review }) {
  if (!review?.length)
    return <p className="py-8 text-center text-muted-foreground">পর্যালোচনা নেই।</p>;
  return (
    <div className="space-y-4">
      {review.map((q) => (
        <Card key={q.id}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">
                {q.index + 1}. <MathText>{q.textBn}</MathText>
              </p>
              {q.isCorrect === true && <Badge variant="success">সঠিক</Badge>}
              {q.isCorrect === false && <Badge variant="destructive">ভুল</Badge>}
              {q.isCorrect === null && <Badge variant="outline">বাদ</Badge>}
            </div>
            <div className="mt-3 space-y-2">
              {q.options.map((o, i) => {
                const chosen = q.selectedOptionId === o.id;
                return (
                  <div
                    key={o.id}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                      o.isCorrect && "border-accent bg-accent/10",
                      chosen && !o.isCorrect && "border-destructive bg-destructive/8"
                    )}
                  >
                    <span className="font-semibold">{String.fromCharCode(65 + i)}.</span>
                    <span><MathText>{o.textBn}</MathText></span>
                    {o.isCorrect && <CheckCircle2 className="ml-auto size-4 text-accent" />}
                    {chosen && !o.isCorrect && <XCircle className="ml-auto size-4 text-destructive" />}
                  </div>
                );
              })}
            </div>
            {q.explanationBn && (
              <div className="mt-3 rounded-lg bg-muted p-3 text-sm">
                <span className="font-semibold text-primary">ব্যাখ্যা: </span>
                <MathText>{q.explanationBn}</MathText>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Leaderboard({ examId }) {
  const [state, setState] = useState({ loading: true, data: null });
  useEffect(() => {
    (async () => {
      try {
        const data = await get(`/api/v1/exams/${examId}/leaderboard`);
        setState({ loading: false, data });
      } catch {
        setState({ loading: false, data: null });
      }
    })();
  }, [examId]);

  if (state.loading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  if (!state.data || !state.data.published)
    return (
      <p className="py-8 text-center text-muted-foreground">
        মেধাতালিকা এখনো প্রকাশিত হয়নি।
      </p>
    );

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {state.data.rows.map((r) => (
            <div key={r.userId} className="flex items-center gap-3 px-4 py-3">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  r.rank === 1 && "bg-warning/15 text-warning",
                  r.rank === 2 && "bg-muted text-foreground",
                  r.rank === 3 && "bg-secondary/15 text-secondary",
                  r.rank > 3 && "bg-primary/10 text-primary"
                )}
              >
                {r.rank <= 3 ? <Award className="size-4" /> : r.rank}
              </span>
              <span className="flex-1 truncate text-sm font-medium">{r.name}</span>
              <span className="text-xs text-muted-foreground">{clock(r.timeTakenSeconds)}</span>
              <span className="w-14 text-right font-bold">{r.score}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
