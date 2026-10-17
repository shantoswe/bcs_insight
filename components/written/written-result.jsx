"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Clock, BookOpen, FileText, Stamp, Volume2 } from "lucide-react";
import { get } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function WrittenResult({ attemptId }) {
  const [state, setState] = useState({ loading: true, data: null });

  useEffect(() => {
    get(`/api/v1/written-attempts/${attemptId}`)
      .then((data) => setState({ loading: false, data }))
      .catch((e) => { toast.error(e.message); setState({ loading: false, data: null }); });
  }, [attemptId]);

  if (state.loading)
    return <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  if (!state.data) return null;

  const { data } = state;
  const evaluated = data.status === "EVALUATED";

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <div className="brand-gradient px-6 py-6 text-center text-white">
          <CheckCircle2 className="mx-auto size-8" />
          <h1 className="mt-2 text-lg font-bold">{data.exam.titleBn || data.exam.titleEn}</h1>
          {evaluated ? (
            <p className="mt-1 text-2xl font-bold">
              {data.totalAwarded} <span className="text-base opacity-80">/ {data.exam.totalMarks}</span>
            </p>
          ) : (
            <Badge className="mt-2 bg-white/20 text-white">
              <Clock className="mr-1 size-3.5" /> মূল্যায়ন চলছে
            </Badge>
          )}
        </div>
        {evaluated && data.feedback && (
          <CardContent className="p-5">
            <p className="text-sm"><span className="font-semibold text-primary">মূল্যায়কের মন্তব্য: </span>{data.feedback}</p>
          </CardContent>
        )}
      </Card>

      {data.questions.map((q) => (
        <Card key={q.id}>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">{q.order + 1}. {q.promptBn}</p>
              <Badge variant="outline" className="shrink-0">
                {q.marksAwarded != null ? `${q.marksAwarded}/${q.marks}` : `${q.marks} নম্বর`}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              {q.fileUrl && (
                <Button asChild variant="outline" size="sm">
                  <a href={q.fileUrl} target="_blank" rel="noreferrer"><FileText className="size-4" /> আপনার উত্তরপত্র</a>
                </Button>
              )}
              {q.annotatedFileUrl && (
                <Button asChild variant="secondary" size="sm">
                  <a href={q.annotatedFileUrl} target="_blank" rel="noreferrer"><Stamp className="size-4" /> মূল্যায়িত (মার্ক করা) কপি</a>
                </Button>
              )}
              {!q.fileUrl && !q.answerText && (
                <span className="text-sm text-muted-foreground">কোনো উত্তর জমা দেওয়া হয়নি</span>
              )}
            </div>

            {q.answerText && (
              <div className="rounded-lg border bg-background p-3">
                <p className="whitespace-pre-wrap text-sm">{q.answerText}</p>
              </div>
            )}

            {q.voiceUrl && (
              <div className="flex items-center gap-2 rounded-lg bg-muted p-2">
                <Volume2 className="size-4 shrink-0 text-primary" />
                <audio controls src={q.voiceUrl} className="h-8 w-full" />
              </div>
            )}

            {q.evaluatorNote && (
              <div className="rounded-lg bg-secondary/10 p-3 text-sm">
                <span className="font-semibold text-secondary">মন্তব্য: </span>{q.evaluatorNote}
              </div>
            )}

            {(q.modelAnswerBn || q.modelAnswerEn) && (
              <div className="rounded-lg bg-accent/10 p-3 text-sm">
                <p className="mb-1 flex items-center gap-1 font-semibold text-accent-foreground">
                  <BookOpen className="size-4" /> মডেল উত্তর
                </p>
                <p className="whitespace-pre-wrap">{q.modelAnswerBn || q.modelAnswerEn}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Button asChild variant="outline"><Link href="/written">আরও লিখিত পরীক্ষা</Link></Button>
    </div>
  );
}
