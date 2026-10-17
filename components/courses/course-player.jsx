"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  PlayCircle, CheckCircle2, Circle, Lock, FileText, Link2, Radio, ClipboardList, Loader2, ShieldCheck,
} from "lucide-react";
import { get, post } from "@/lib/client-api";
import { cn, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EnrollPaid } from "@/components/courses/payment-dialog";

const TYPE_ICON = {
  VIDEO: PlayCircle,
  PDF: FileText,
  RESOURCE: Link2,
  LIVE_CLASS: Radio,
  EXAM: ClipboardList,
  QUIZ: ClipboardList,
};

export function CoursePlayer({ course, paymentConfig }) {
  const router = useRouter();
  const allLessons = useMemo(() => course.sections.flatMap((s) => s.lessons), [course]);
  const firstPlayable = allLessons.find((l) => l.bunnyVideoId || l.isFreePreview) ?? allLessons[0];
  const [activeId, setActiveId] = useState(firstPlayable?.id ?? null);
  const [progress, setProgress] = useState(() =>
    Object.fromEntries(allLessons.map((l) => [l.id, l.completed]))
  );
  const [enrolling, setEnrolling] = useState(false);

  const active = allLessons.find((l) => l.id === activeId) ?? null;
  const locked = !course.enrolled;

  const doneCount = Object.values(progress).filter(Boolean).length;
  const pct = allLessons.length ? Math.round((doneCount / allLessons.length) * 100) : 0;

  async function enroll() {
    setEnrolling(true);
    try {
      await post(`/api/v1/courses/${course.id}/enroll`, {});
      toast.success("কোর্সে যুক্ত হয়েছেন!");
      router.refresh();
    } catch (e) {
      toast.error(e.message);
      setEnrolling(false);
    }
  }

  async function markComplete(lesson) {
    try {
      await post(`/api/v1/lessons/${lesson.id}/progress`, { completed: !progress[lesson.id] });
      setProgress((p) => ({ ...p, [lesson.id]: !p[lesson.id] }));
    } catch (e) {
      toast.error(e.message);
    }
  }

  const canPlay = active && (course.enrolled || active.isFreePreview) && !!active.bunnyVideoId;

  // Fetch a fresh signed, enrollment-gated playback URL whenever the active
  // video lesson changes. Nothing playable is ever built on the client.
  const [play, setPlay] = useState({ loading: false, embedUrl: null, watermark: "" });
  useEffect(() => {
    if (!canPlay) { setPlay({ loading: false, embedUrl: null, watermark: "" }); return; }
    let alive = true;
    setPlay({ loading: true, embedUrl: null, watermark: "" });
    get(`/api/v1/lessons/${active.id}/play`)
      .then((d) => { if (alive) setPlay({ loading: false, embedUrl: d.embedUrl, watermark: d.watermark }); })
      .catch(() => { if (alive) setPlay({ loading: false, embedUrl: null, watermark: "" }); });
    return () => { alive = false; };
  }, [active?.id, canPlay]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{course.titleBn || course.titleEn}</h1>
        {course.descriptionBn && <p className="mt-1 text-muted-foreground">{course.descriptionBn}</p>}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* player */}
        <div className="space-y-4">
          <div
            className="relative aspect-video select-none overflow-hidden rounded-xl border bg-black"
            onContextMenu={(e) => e.preventDefault()}
          >
            {play.loading ? (
              <div className="flex h-full items-center justify-center"><Loader2 className="size-8 animate-spin text-white/70" /></div>
            ) : play.embedUrl ? (
              <>
                <iframe
                  key={active.id}
                  src={play.embedUrl}
                  className="h-full w-full"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  title={active.titleBn || active.titleEn}
                />
                {/* moving per-viewer watermark — deters re-recording/redistribution */}
                {play.watermark && <MovingWatermark text={play.watermark} />}
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-white/80">
                {locked && !active?.isFreePreview ? <Lock className="size-10" /> : <PlayCircle className="size-10" />}
                <p className="text-sm">
                  {locked && !active?.isFreePreview
                    ? "কোর্সে ভর্তি হয়ে ভিডিও দেখুন"
                    : active?.videoStatus === "PROCESSING"
                      ? "ভিডিও প্রসেসিং হচ্ছে…"
                      : "এই লেসনে ভিডিও নেই"}
                </p>
              </div>
            )}
          </div>
          {play.embedUrl && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-accent" /> সুরক্ষিত ভিডিও — ডাউনলোড বন্ধ, আপনার পরিচয় ওয়াটারমার্ক করা আছে।
            </p>
          )}

          {active && (
            <Card>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <h2 className="font-semibold">{active.titleBn || active.titleEn}</h2>
                  {active.durationSeconds ? (
                    <p className="text-xs text-muted-foreground">{formatDuration(active.durationSeconds)}</p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  {active.type === "PDF" && active.filePath && (
                    <Button asChild variant="outline" size="sm"><a href={active.filePath} target="_blank" rel="noreferrer">PDF খুলুন</a></Button>
                  )}
                  {(active.type === "RESOURCE" || active.type === "LIVE_CLASS") && active.linkUrl && (
                    <Button asChild variant="outline" size="sm"><a href={active.linkUrl} target="_blank" rel="noreferrer">লিংক খুলুন</a></Button>
                  )}
                  {course.enrolled && (
                    <Button size="sm" variant={progress[active.id] ? "outline" : "accent"} onClick={() => markComplete(active)}>
                      <CheckCircle2 className="size-4" />
                      {progress[active.id] ? "সম্পন্ন হয়েছে" : "সম্পন্ন চিহ্নিত করুন"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* curriculum */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              {course.enrolled ? (
                <>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium">আপনার অগ্রগতি</span>
                    <span className="text-muted-foreground">{pct}%</span>
                  </div>
                  <Progress value={pct} />
                  <p className="mt-2 text-xs text-muted-foreground">{doneCount}/{allLessons.length} লেসন সম্পন্ন</p>
                </>
              ) : course.isFree || Number(course.priceBDT) === 0 ? (
                <Button className="w-full" onClick={enroll} disabled={enrolling}>
                  {enrolling ? <Loader2 className="size-4 animate-spin" /> : <PlayCircle className="size-4" />}
                  ফ্রি এনরোল করুন
                </Button>
              ) : (
                <EnrollPaid course={course} payment={course.payment} paymentConfig={paymentConfig} />
              )}
            </CardContent>
          </Card>

          <div className="space-y-3">
            {course.sections.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-3">
                  <p className="mb-2 px-1 text-sm font-semibold">{s.titleBn || s.titleEn}</p>
                  <div className="space-y-1">
                    {s.lessons.map((l) => {
                      const Icon = TYPE_ICON[l.type] ?? PlayCircle;
                      const isActive = l.id === activeId;
                      const lessonLocked = locked && !l.isFreePreview;
                      return (
                        <button
                          key={l.id}
                          onClick={() => setActiveId(l.id)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                            isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
                          )}
                        >
                          {progress[l.id] ? (
                            <CheckCircle2 className="size-4 shrink-0 text-accent" />
                          ) : lessonLocked ? (
                            <Lock className="size-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <Icon className="size-4 shrink-0 text-muted-foreground" />
                          )}
                          <span className="flex-1 truncate">{l.titleBn || l.titleEn}</span>
                          {l.isFreePreview && <Badge variant="success" className="shrink-0 text-[10px]">ফ্রি</Badge>}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Semi-transparent identity watermark that hops between corners every few
// seconds. pointer-events:none keeps the player controls usable. It won't stop
// a determined recorder, but it ties any leaked copy to the viewer.
function MovingWatermark({ text }) {
  const positions = [
    { top: "8%", left: "6%" },
    { top: "8%", right: "6%" },
    { bottom: "14%", left: "6%" },
    { bottom: "14%", right: "6%" },
    { top: "45%", left: "35%" },
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % positions.length), 5000);
    return () => clearInterval(t);
  }, []); // eslint-disable-line
  return (
    <div
      className="pointer-events-none absolute z-10 select-none rounded bg-black/20 px-2 py-0.5 text-[11px] font-medium text-white/45 transition-all duration-1000"
      style={positions[i]}
    >
      {text}
    </div>
  );
}
