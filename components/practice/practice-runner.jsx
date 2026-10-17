"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Bookmark, RotateCcw, Play, ChevronRight } from "lucide-react";
import { get, post } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MathText } from "@/components/ui/math-text";
import { TaxonomyFilter } from "@/components/practice/taxonomy-filter";

export function PracticeRunner() {
  const [filter, setFilter] = useState({});
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });
  const [bookmarked, setBookmarked] = useState({});

  async function startSession() {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (filter.subjectId) q.set("subjectId", filter.subjectId);
      if (filter.topicId) q.set("topicId", filter.topicId);
      if (filter.difficulty) q.set("difficulty", filter.difficulty);
      q.set("limit", "20");
      const data = await get(`/api/v1/practice?${q}`);
      if (!data.length) {
        toast.info("এই ফিল্টারে কোনো প্রশ্ন নেই।");
        setLoading(false);
        return;
      }
      setQuestions(data);
      setIdx(0);
      setPicked(null);
      setStats({ correct: 0, wrong: 0 });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  function choose(opt) {
    if (picked) return;
    setPicked(opt);
    setStats((s) => (opt.isCorrect ? { ...s, correct: s.correct + 1 } : { ...s, wrong: s.wrong + 1 }));
  }

  function next() {
    if (idx + 1 >= questions.length) {
      toast.success(`সেশন শেষ! ${stats.correct} সঠিক, ${stats.wrong} ভুল`);
      setQuestions(null);
      return;
    }
    setIdx((i) => i + 1);
    setPicked(null);
  }

  async function toggleBookmark(qid) {
    try {
      const { bookmarked: bm } = await post("/api/v1/bookmarks", { questionId: qid });
      setBookmarked((b) => ({ ...b, [qid]: bm }));
      toast.success(bm ? "ভুল খাতায় যুক্ত হয়েছে" : "ভুল খাতা থেকে সরানো হয়েছে");
    } catch (e) {
      toast.error(e.message);
    }
  }

  // ---- setup screen ----
  if (!questions) {
    return (
      <Card>
        <CardContent className="space-y-5 p-6">
          <div>
            <h2 className="font-semibold">প্র্যাকটিস সেশন সাজান</h2>
            <p className="text-sm text-muted-foreground">বিষয়, টপিক ও কঠিনতা বেছে নিন — অথবা সব রেখে দিন।</p>
          </div>
          <TaxonomyFilter onChange={setFilter} />
          <Button onClick={startSession} disabled={loading} size="lg">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            প্র্যাকটিস শুরু করুন
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ---- question screen ----
  const q = questions[idx];
  const progress = Math.round((idx / questions.length) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Progress value={progress} className="flex-1" />
        <span className="text-sm font-medium text-muted-foreground">{idx + 1}/{questions.length}</span>
      </div>
      <div className="flex gap-2 text-sm">
        <Badge variant="success">সঠিক {stats.correct}</Badge>
        <Badge variant="destructive">ভুল {stats.wrong}</Badge>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-3">
            <MathText as="p" className="text-lg font-medium leading-relaxed">{q.textBn}</MathText>
            <button onClick={() => toggleBookmark(q.id)} title="ভুল খাতা">
              <Bookmark className={cn("size-5", bookmarked[q.id] ? "fill-secondary text-secondary" : "text-muted-foreground")} />
            </button>
          </div>
          {q.subject && <Badge variant="outline" className="mt-2">{q.subject.nameBn}</Badge>}
          {q.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={q.imageUrl} alt="" className="mt-4 max-h-56 rounded-lg border" />
          )}

          <div className="mt-5 space-y-3">
            {q.options.map((o, i) => {
              const isPicked = picked?.id === o.id;
              const reveal = !!picked;
              return (
                <button
                  key={o.id}
                  onClick={() => choose(o)}
                  disabled={reveal}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all disabled:cursor-default",
                    !reveal && "border-border bg-background hover:border-primary/40",
                    reveal && o.isCorrect && "border-accent bg-accent/10",
                    reveal && isPicked && !o.isCorrect && "border-destructive bg-destructive/8",
                    reveal && !o.isCorrect && !isPicked && "opacity-60"
                  )}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1"><MathText>{o.textBn}</MathText></span>
                  {reveal && o.isCorrect && <CheckCircle2 className="size-5 text-accent" />}
                  {reveal && isPicked && !o.isCorrect && <XCircle className="size-5 text-destructive" />}
                </button>
              );
            })}
          </div>

          {picked && (
            <div className="mt-5 space-y-4">
              {q.explanationBn && (
                <div className="rounded-lg bg-muted p-4 text-sm">
                  <span className="font-semibold text-primary">ব্যাখ্যা: </span>
                  <MathText>{q.explanationBn}</MathText>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={next}>
                  {idx + 1 >= questions.length ? "শেষ করুন" : "পরের প্রশ্ন"}
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Button variant="ghost" size="sm" onClick={() => setQuestions(null)}>
        <RotateCcw className="size-4" /> নতুন সেশন
      </Button>
    </div>
  );
}
