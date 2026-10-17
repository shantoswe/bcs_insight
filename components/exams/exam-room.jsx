"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Clock, Send, Check, ChevronDown, X, AlertTriangle } from "lucide-react";
import { get, post } from "@/lib/client-api";
import { trackEvent } from "@/lib/track";
import { clock, cn, toBn, BN_OPTION_LABELS } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MathText } from "@/components/ui/math-text";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

export function ExamRoom({ attemptId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState({}); // qid -> optionId (locked once set)
  const [remaining, setRemaining] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all"); // all | answered | unanswered
  const [subjectFilter, setSubjectFilter] = useState("");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const state = await get(`/api/v1/attempts/${attemptId}`);
        if (state.attempt.status !== "IN_PROGRESS") {
          router.replace(`/attempts/${attemptId}/result`);
          return;
        }
        setData(state);
        const a = {};
        for (const row of state.answers ?? []) if (row.selectedOptionId) a[row.questionId] = row.selectedOptionId;
        setAnswers(a);
        setRemaining(Math.max(0, Math.round((new Date(state.attempt.deadlineAt).getTime() - Date.now()) / 1000)));
      } catch (e) {
        toast.error(e.message);
        router.replace("/exams");
      } finally {
        setLoading(false);
      }
    })();
  }, [attemptId, router]);

  const doSubmit = useCallback(
    async (auto = false) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      try {
        await post(`/api/v1/attempts/${attemptId}/submit`, {});
        trackEvent("SubmitExam", { content_type: "exam", auto });
        if (auto) toast.info("সময় শেষ — উত্তর স্বয়ংক্রিয়ভাবে জমা হয়েছে");
        else toast.success("পরীক্ষা জমা হয়েছে");
        router.replace(`/attempts/${attemptId}/result`);
      } catch (e) {
        toast.error(e.message);
        submittedRef.current = false;
        setSubmitting(false);
      }
    },
    [attemptId, router]
  );

  useEffect(() => {
    if (loading || !data) return;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(t); doSubmit(true); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [loading, data, doSubmit]);

  useEffect(() => {
    if (!data) return;
    const onHide = () => {
      if (document.visibilityState === "hidden") post(`/api/v1/attempts/${attemptId}/tab-switch`, {}).catch(() => {});
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [data, attemptId]);

  const questions = data?.questions ?? [];

  const choose = useCallback(
    (q, optionId) => {
      if (answers[q.id]) return; // locked
      setAnswers((a) => ({ ...a, [q.id]: optionId }));
      post(`/api/v1/attempts/${attemptId}/answer`, { questionId: q.id, selectedOptionId: optionId }).catch((e) => {
        // rollback only if server rejected for a reason other than the lock
        if (e.status !== 409) setAnswers((a) => { const n = { ...a }; delete n[q.id]; return n; });
      });
    },
    [answers, attemptId]
  );

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const subjects = useMemo(
    () => [...new Set(questions.map((q) => q.subject?.nameBn).filter(Boolean))],
    [questions]
  );
  const negative = Number(data?.attempt?.exam?.negativeMarking ?? 0);

  const visible = questions.filter((q) => {
    if (statusFilter === "answered" && !answers[q.id]) return false;
    if (statusFilter === "unanswered" && answers[q.id]) return false;
    if (subjectFilter && q.subject?.nameBn !== subjectFilter) return false;
    return true;
  });

  if (loading)
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  if (!data) return null;

  const low = remaining <= 60;

  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      {submitting && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-background/90 backdrop-blur">
          <Loader2 className="size-12 animate-spin text-primary" />
          <p className="font-semibold">জমা দেওয়া হচ্ছে...</p>
        </div>
      )}

      {/* sticky top bar */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2.5">
          <FilterDropdown
            label={statusFilter === "all" ? "সব" : statusFilter === "answered" ? "উত্তরিত" : "অনুত্তরিত"}
            active={statusFilter !== "all"}
            options={[
              { val: "all", label: "সব প্রশ্ন", count: questions.length },
              { val: "answered", label: "উত্তরিত", count: answeredCount },
              { val: "unanswered", label: "অনুত্তরিত", count: questions.length - answeredCount },
            ]}
            value={statusFilter}
            onSelect={setStatusFilter}
          />
          {subjects.length > 1 && (
            <FilterDropdown
              label={subjectFilter || "সব বিষয়"}
              active={!!subjectFilter}
              options={[
                { val: "", label: "সব বিষয়", count: questions.length },
                ...subjects.map((s) => ({ val: s, label: s, count: questions.filter((q) => q.subject?.nameBn === s).length })),
              ]}
              value={subjectFilter}
              onSelect={setSubjectFilter}
            />
          )}
          <div className="flex-1" />
          <span className="rounded-lg bg-accent/12 px-2 py-1 text-xs font-semibold tabular-nums text-accent-foreground">
            {toBn(answeredCount)}/{toBn(questions.length)}
          </span>
          <div className={cn("flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-sm font-bold tabular-nums", low ? "animate-pulse bg-destructive/12 text-destructive" : "bg-primary/12 text-primary")}>
            <Clock className="size-4" /> {clock(remaining)}
          </div>
          <Button size="sm" className="hidden sm:flex" onClick={() => setConfirmOpen(true)}>
            <Send className="size-4" /> জমা
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-3 pt-4">
        <h1 className="mb-3 text-sm font-bold">{data.attempt.exam.titleBn || data.attempt.exam.titleEn}</h1>

        {negative > 0 && !bannerDismissed && (
          <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-secondary/25 bg-secondary/8 px-3 py-2">
            <p className="text-xs text-secondary"><b>নেগেটিভ মার্কিং:</b> প্রতিটি ভুল উত্তরে {toBn(negative)} নম্বর কাটা যাবে।</p>
            <button onClick={() => setBannerDismissed(true)} className="text-secondary"><X className="size-3.5" /></button>
          </div>
        )}

        {visible.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">এই ফিল্টারে কোনো প্রশ্ন নেই</p>
        ) : (
          <div className="space-y-3">
            {visible.map((q) => {
              const isAnswered = !!answers[q.id];
              return (
                <div key={q.id} className={cn("overflow-hidden rounded-xl border-2 bg-card", isAnswered ? "border-accent/30" : "border-border")}>
                  <div className="p-3.5">
                    <div className="mb-3 flex items-start gap-2">
                      <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold", isAnswered ? "bg-accent/15 text-accent-foreground" : "bg-primary/12 text-primary")}>
                        {toBn(q.index + 1)}
                      </span>
                      <div className="min-w-0 flex-1">
                        {q.subject && <span className="mb-0.5 block text-[10px] font-medium text-muted-foreground">{q.subject.nameBn}</span>}
                        <MathText as="p" className="text-sm font-medium leading-snug">{q.textBn}</MathText>
                        {q.textEn && <MathText as="p" className="mt-0.5 text-xs text-muted-foreground">{q.textEn}</MathText>}
                        {q.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={q.imageUrl} alt="" className="mt-2 max-h-64 rounded-lg border" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {q.options.map((o, i) => {
                        const selected = answers[q.id] === o.id;
                        return (
                          <button
                            key={o.id}
                            onClick={() => choose(q, o.id)}
                            disabled={isAnswered}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-lg border-2 px-3 py-2 text-left transition-all",
                              selected && "border-accent bg-accent/12",
                              !selected && isAnswered && "cursor-not-allowed border-border opacity-50",
                              !isAnswered && "border-border bg-background hover:border-primary/40"
                            )}
                          >
                            <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold", selected ? "border-accent bg-accent text-white" : "border-border text-muted-foreground")}>
                              {selected ? <Check className="size-3" strokeWidth={3} /> : BN_OPTION_LABELS[i]}
                            </span>
                            <span className="min-w-0 flex-1 text-sm">
                              {o.textBn && <MathText>{o.textBn}</MathText>}
                              {o.imageUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={o.imageUrl} alt="" className="mt-1 max-h-32 rounded border" />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {negative > 0 && !isAnswered && (
                      <p className="mt-1.5 text-right text-[10px] text-secondary">⚠ ভুল উত্তরে −{toBn(negative)} কাটা যাবে</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <Button size="lg" onClick={() => setConfirmOpen(true)}>
            <Send className="size-4" /> পরীক্ষা জমা দিন ({toBn(answeredCount)}/{toBn(questions.length)})
          </Button>
        </div>
      </div>

      {/* mobile submit bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 p-3 backdrop-blur sm:hidden">
        <Button className="w-full" onClick={() => setConfirmOpen(true)}>
          <Send className="size-4" /> জমা দিন ({toBn(answeredCount)}/{toBn(questions.length)})
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>পরীক্ষা জমা দেবেন?</DialogTitle>
            <DialogDescription>
              {questions.length - answeredCount > 0 ? (
                <span className="flex items-center gap-1.5 text-secondary">
                  <AlertTriangle className="size-4" /> {toBn(questions.length - answeredCount)}টি প্রশ্ন অনুত্তরিত।
                </span>
              ) : ("সব প্রশ্নের উত্তর দেওয়া হয়েছে।")}
              <br />জমা দেওয়ার পর আর পরিবর্তন করা যাবে না।
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>ফিরে যান</Button>
            <Button onClick={() => doSubmit(false)} disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />} নিশ্চিত জমা
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterDropdown({ label, active, options, value, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn("flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium", active ? "border-primary/35 bg-primary/12 text-primary" : "border-border bg-muted text-muted-foreground")}
      >
        <span className="max-w-24 truncate">{label}</span> <ChevronDown className="size-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1.5 max-h-64 min-w-40 overflow-y-auto rounded-xl border bg-popover p-1 shadow-lg">
            {options.map((o) => (
              <button
                key={o.val}
                onClick={() => { onSelect(o.val); setOpen(false); }}
                className={cn("flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs", value === o.val ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted")}
              >
                <span className="truncate">{o.label}</span>
                <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{toBn(o.count)}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
