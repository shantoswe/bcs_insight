"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import {
  Loader2, Save, Mic, Square, Play, Trash2, RotateCcw, FileText, Stamp,
  CheckCircle2, ChevronDown, ChevronUp, BookOpen, Upload,
} from "lucide-react";
import { get, post } from "@/lib/client-api";
import { uploadDirectWithProgress } from "@/lib/upload-progress";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const PdfAnnotator = dynamic(() => import("@/components/admin/pdf-annotator"), { ssr: false });

function pickMime() {
  if (typeof MediaRecorder === "undefined") return "";
  for (const t of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]) {
    try { if (MediaRecorder.isTypeSupported(t)) return t; } catch {}
  }
  return "audio/mp4";
}

function VoiceRecorder({ voiceUrl, onSaved, onRemove }) {
  const [state, setState] = useState("idle"); // idle | recording | preview | uploading
  const [blob, setBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const recRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const mimeRef = useRef("");

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickMime();
      mimeRef.current = mime;
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        clearInterval(timerRef.current);
        stream.getTracks().forEach((t) => t.stop());
        setTimeout(() => {
          const type = mimeRef.current || "audio/mp4";
          const b = new Blob(chunksRef.current, { type });
          if (b.size === 0) { toast.error("রেকর্ডিং ব্যর্থ"); setState("idle"); return; }
          setBlob(b);
          setPreviewUrl(URL.createObjectURL(b));
          setState("preview");
        }, 400);
      };
      rec.start();
      recRef.current = rec;
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
      setState("recording");
    } catch {
      toast.error("মাইক্রোফোন অ্যাক্সেস করা যায়নি");
    }
  }
  function stop() { recRef.current?.stop(); clearInterval(timerRef.current); }

  async function upload() {
    if (!blob) return;
    setState("uploading");
    const mime = blob.type || "audio/mp4";
    try {
      // presign returns raw JSON — use fetch, not the envelope-unwrapping post()
      const pr = await fetch("/api/v1/admin/uploads/voice-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: mime }),
      });
      if (!pr.ok) throw new Error("আপলোড লিংক তৈরি ব্যর্থ");
      const { uploadUrl, publicUrl } = await pr.json();
      await uploadDirectWithProgress(uploadUrl, blob, mime, () => {});
      onSaved(publicUrl);
      setBlob(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setState("idle");
      toast.success("ভয়েস সংরক্ষিত হয়েছে");
    } catch (e) {
      toast.error(e.message || "আপলোড ব্যর্থ");
      setState("preview");
    }
  }
  function discard() {
    setBlob(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setState("idle");
  }
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase text-muted-foreground">ভয়েস মন্তব্য</p>
      {voiceUrl && state === "idle" && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted p-2">
          <audio controls src={voiceUrl} className="h-8 flex-1" />
          <button onClick={onRemove} className="p-1.5 text-destructive hover:bg-destructive/10 rounded"><Trash2 size={14} /></button>
          <button onClick={start} className="p-1.5 text-primary hover:bg-primary/10 rounded"><RotateCcw size={14} /></button>
        </div>
      )}
      {!voiceUrl && state === "idle" && (
        <button type="button" onClick={start} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-2 text-sm text-muted-foreground hover:border-destructive/40 hover:text-destructive">
          <Mic size={16} /> রেকর্ড করুন
        </button>
      )}
      {state === "recording" && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/8 p-3">
          <span className="size-3 shrink-0 animate-pulse rounded-full bg-destructive" />
          <span className="font-mono text-sm font-semibold text-destructive">{fmt(elapsed)}</span>
          <span className="flex-1 text-xs text-destructive">রেকর্ডিং চলছে...</span>
          <Button size="sm" variant="destructive" onClick={stop}><Square size={12} /> থামুন</Button>
        </div>
      )}
      {state === "preview" && previewUrl && (
        <div className="space-y-2 rounded-xl border border-warning/30 bg-warning/10 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold"><Play size={14} /> প্রিভিউ — শুনে সিদ্ধান্ত নিন</div>
          <audio controls src={previewUrl} className="h-8 w-full" />
          <div className="flex gap-2">
            <Button size="sm" variant="accent" className="flex-1" onClick={upload}><Upload size={13} /> সংরক্ষণ</Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={discard}><RotateCcw size={13} /> আবার</Button>
          </div>
        </div>
      )}
      {state === "uploading" && (
        <div className="flex items-center gap-3 rounded-xl border bg-primary/8 p-3 text-sm text-primary">
          <Loader2 className="size-4 animate-spin" /> ভয়েস আপলোড হচ্ছে...
        </div>
      )}
    </div>
  );
}

function QuestionEvalCard({ q, idx, evalData, onChange, onAnnotate }) {
  const [expanded, setExpanded] = useState(true);
  const done = evalData.mark !== "" || evalData.comment || evalData.voiceUrl;
  const max = q.marks;

  return (
    <div className={cn("overflow-hidden rounded-2xl border-2 transition-colors", done ? "border-accent/40" : "border-border")}>
      <div className={cn("flex cursor-pointer items-center gap-3 p-4", done ? "bg-accent/8" : "bg-muted/40")} onClick={() => setExpanded((e) => !e)}>
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold", done ? "bg-accent text-white" : "bg-muted text-muted-foreground")}>
          {done ? <CheckCircle2 size={16} /> : idx + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">প্রশ্ন {idx + 1}</p>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
            {q.fileUrl ? <span className="text-primary">• PDF জমা আছে</span> : <span>• কোনো ফাইল নেই</span>}
            {evalData.mark !== "" && <span className="font-semibold text-accent-foreground">• {evalData.mark} নম্বর</span>}
          </div>
        </div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>

      {expanded && (
        <div className="space-y-4 p-4">
          <div className="rounded-xl border border-primary/15 bg-primary/5 p-3">
            <p className="mb-1 text-xs font-semibold uppercase text-primary">প্রশ্ন</p>
            <p className="text-sm">{q.promptBn}</p>
            {(q.modelAnswerBn || q.modelAnswerEn) && (
              <div className="mt-2 rounded-lg bg-accent/10 p-2 text-xs">
                <p className="mb-0.5 flex items-center gap-1 font-semibold text-accent-foreground"><BookOpen size={12} /> মডেল উত্তর</p>
                <p className="whitespace-pre-wrap">{q.modelAnswerBn || q.modelAnswerEn}</p>
              </div>
            )}
          </div>

          {/* answer file + annotate */}
          <div className="flex flex-wrap gap-2">
            {q.fileUrl ? (
              <>
                <Button asChild variant="outline" size="sm"><a href={q.fileUrl} target="_blank" rel="noreferrer"><FileText className="size-4" /> উত্তরপত্র দেখুন</a></Button>
                <Button variant="secondary" size="sm" onClick={() => onAnnotate(q)}>
                  <Stamp className="size-4" /> {evalData.annotatedFileUrl ? "পুনরায় মার্ক করুন" : "PDF-এ মার্ক করুন"}
                </Button>
                {evalData.annotatedFileUrl && (
                  <Button asChild variant="ghost" size="sm"><a href={evalData.annotatedFileUrl} target="_blank" rel="noreferrer"><CheckCircle2 className="size-4 text-accent" /> মার্ক করা কপি</a></Button>
                )}
              </>
            ) : q.answerText ? (
              <div className="w-full rounded-lg border bg-background p-3 text-sm"><p className="whitespace-pre-wrap">{q.answerText}</p></div>
            ) : (
              <span className="text-sm text-muted-foreground">শিক্ষার্থী কোনো উত্তর জমা দেয়নি।</span>
            )}
          </div>

          {/* mark + comment + voice */}
          <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
            <div>
              <Label className="mb-1.5 block text-xs uppercase">নম্বর {max ? <span className="font-bold text-primary">/ {max}</span> : null}</Label>
              <Input type="number" step="0.5" min="0" max={max || undefined} className="w-28 text-center text-lg font-bold"
                value={evalData.mark} onChange={(e) => onChange("mark", e.target.value)} placeholder="০" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs uppercase">মন্তব্য</Label>
              <Textarea rows={2} value={evalData.comment} onChange={(e) => onChange("comment", e.target.value)} placeholder="শিক্ষার্থীর জন্য মন্তব্য (ঐচ্ছিক)..." />
            </div>
          </div>
          <VoiceRecorder voiceUrl={evalData.voiceUrl} onSaved={(url) => onChange("voiceUrl", url)} onRemove={() => onChange("voiceUrl", "")} />
        </div>
      )}
    </div>
  );
}

export function EvaluatePanel({ attemptId, onClose, onSaved }) {
  const [data, setData] = useState(null);
  const [evals, setEvals] = useState({}); // answerId -> { mark, comment, voiceUrl, annotatedFileUrl }
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [annotating, setAnnotating] = useState(null); // { answerId, fileUrl, annotatedFileUrl }

  useEffect(() => {
    get(`/api/v1/admin/written-attempts/${attemptId}`)
      .then((d) => {
        setData(d);
        setFeedback(d.feedback ?? "");
        setEvals(Object.fromEntries(d.questions.filter((q) => q.answerId).map((q) => [q.answerId, {
          mark: q.marksAwarded != null ? String(q.marksAwarded) : "",
          comment: q.evaluatorNote ?? "",
          voiceUrl: q.voiceUrl ?? "",
          annotatedFileUrl: q.annotatedFileUrl ?? "",
        }])));
      })
      .catch((e) => toast.error(e.message));
  }, [attemptId]);

  function change(answerId, key, val) {
    setEvals((p) => ({ ...p, [answerId]: { ...p[answerId], [key]: val } }));
  }

  async function save() {
    setSaving(true);
    try {
      const marks = Object.entries(evals).map(([answerId, e]) => ({
        answerId,
        marksAwarded: Number(e.mark) || 0,
        evaluatorNote: e.comment || null,
        voiceUrl: e.voiceUrl || null,
      }));
      await post(`/api/v1/admin/written-attempts/${attemptId}`, { feedback: feedback || null, marks });
      toast.success("মূল্যায়ন সম্পন্ন হয়েছে");
      onSaved();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  const total = Object.values(evals).reduce((s, e) => s + (Number(e.mark) || 0), 0);

  return (
    <>
      {/* Hide (don't unmount) the marking dialog while the full-screen annotator
          is open, so annotator clicks aren't treated as outside-clicks that
          would close everything. State lives here, so it's preserved. */}
      <Dialog open={!annotating} onOpenChange={(o) => { if (!o && !annotating) onClose(); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>উত্তর মূল্যায়ন{data ? ` — ${data.student?.nameBn || data.student?.name}` : ""}</DialogTitle>
          </DialogHeader>
          {!data ? (
            <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm">
                <span>মোট প্রাপ্ত নম্বর</span>
                <Badge className="text-base">{total} / {data.exam.totalMarks}</Badge>
              </div>
              {data.questions.map((q, i) => (
                q.answerId ? (
                  <QuestionEvalCard key={q.id} q={q} idx={i} evalData={evals[q.answerId] ?? { mark: "", comment: "", voiceUrl: "", annotatedFileUrl: "" }}
                    onChange={(k, v) => change(q.answerId, k, v)}
                    onAnnotate={(qq) => setAnnotating({ answerId: qq.answerId, fileUrl: qq.fileUrl, annotatedFileUrl: evals[qq.answerId]?.annotatedFileUrl })} />
                ) : (
                  <div key={q.id} className="rounded-xl border p-3 text-sm text-muted-foreground">প্রশ্ন {i + 1}: শিক্ষার্থী উত্তর দেয়নি।</div>
                )
              ))}
              <div className="space-y-1.5">
                <Label>সার্বিক মন্তব্য</Label>
                <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="সম্পূর্ণ খাতা সম্পর্কে মন্তব্য..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={save} disabled={saving || !data}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} সংরক্ষণ ও সম্পন্ন</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {annotating && (
        <PdfAnnotator
          fileUrl={annotating.fileUrl}
          annotatedUrl={annotating.annotatedFileUrl}
          answerId={annotating.answerId}
          onSaved={(url) => { change(annotating.answerId, "annotatedFileUrl", url); }}
          onClose={() => setAnnotating(null)}
        />
      )}
    </>
  );
}
