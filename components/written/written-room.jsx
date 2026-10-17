"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Loader2, Clock, Send, Upload, FileText, X, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { get, post } from "@/lib/client-api";
import { uploadDirectWithProgress } from "@/lib/upload-progress";
import { clock, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { WrittenResult } from "@/components/written/written-result";

const MAX_PDF = 50 * 1024 * 1024;

export function WrittenRoom({ writtenExamId }) {
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [files, setFiles] = useState({}); // qId -> { name, url, uploading, progress }
  const [remaining, setRemaining] = useState(0);
  const [uploadWindow, setUploadWindow] = useState(0); // seconds of upload window at the tail
  const [submitting, setSubmitting] = useState(false);
  const [submittedAttemptId, setSubmittedAttemptId] = useState(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await get(`/api/v1/written/${writtenExamId}`);
        if (data.alreadySubmitted) {
          setSubmittedAttemptId(data.attemptId);
          setLoading(false);
          return;
        }
        setExam(data);
        const uw = (data.uploadWindowMinutes ?? 10) * 60;
        setUploadWindow(uw);
        setRemaining(data.durationMinutes * 60 + uw);
      } catch (e) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [writtenExamId]);

  const submit = useCallback(
    async (auto = false) => {
      if (submittedRef.current) return;
      if (Object.values(files).some((f) => f?.uploading)) {
        if (!auto) toast.error("আপলোড শেষ হওয়া পর্যন্ত অপেক্ষা করুন");
        return;
      }
      submittedRef.current = true;
      setSubmitting(true);
      try {
        const answers = (exam?.questions ?? []).map((q) => ({
          writtenQuestionId: q.id,
          fileUrl: files[q.id]?.url || null,
        }));
        const { attemptId } = await post(`/api/v1/written/${writtenExamId}/submit`, { answers });
        if (auto) toast.info("সময় শেষ — উত্তর জমা হয়েছে");
        else toast.success("উত্তর জমা হয়েছে");
        setSubmittedAttemptId(attemptId);
      } catch (e) {
        toast.error(e.message);
        submittedRef.current = false;
        setSubmitting(false);
      }
    },
    [files, exam, writtenExamId]
  );

  useEffect(() => {
    if (loading || !exam) return;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(t);
          submit(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [loading, exam, submit]);

  async function handleFile(qId, file) {
    if (!file) return;
    if (file.type !== "application/pdf") return toast.error("শুধুমাত্র PDF আপলোড করুন");
    if (file.size > MAX_PDF) return toast.error("ফাইল সর্বোচ্চ ৫০ MB");

    setFiles((p) => ({ ...p, [qId]: { name: file.name, url: null, uploading: true, progress: 0 } }));
    try {
      // presign routes return raw JSON (not the {success,data} envelope), so
      // call them with fetch directly rather than the unwrapping post() helper.
      const presignRes = await fetch(`/api/v1/written/${writtenExamId}/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: "application/pdf" }),
      });
      if (!presignRes.ok) throw new Error("আপলোড লিংক তৈরি ব্যর্থ");
      const { uploadUrl, publicUrl } = await presignRes.json();
      await uploadDirectWithProgress(uploadUrl, file, "application/pdf", (pct) =>
        setFiles((p) => (p[qId] ? { ...p, [qId]: { ...p[qId], progress: pct } } : p))
      );
      setFiles((p) => ({ ...p, [qId]: { name: file.name, url: publicUrl, uploading: false, progress: 100 } }));
      toast.success("আপলোড হয়েছে");
    } catch (e) {
      toast.error(e.message || "আপলোড ব্যর্থ");
      setFiles((p) => {
        const n = { ...p };
        delete n[qId];
        return n;
      });
    }
  }

  if (loading)
    return <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  if (submittedAttemptId) return <WrittenResult attemptId={submittedAttemptId} />;
  if (!exam) return null;

  const inUploadWindow = remaining <= uploadWindow;
  const low = remaining <= 120;
  const uploadedCount = Object.values(files).filter((f) => f?.url).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{exam.titleBn || exam.titleEn}</h1>
          <p className="text-sm text-muted-foreground">
            মোট নম্বর {exam.totalMarks} · {uploadedCount}/{exam.questions.length} আপলোড হয়েছে
          </p>
        </div>
        <div className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono font-bold tabular-nums",
          low ? "bg-destructive/12 text-destructive" : inUploadWindow ? "bg-secondary/15 text-secondary" : "bg-primary/12 text-primary"
        )}>
          <Clock className="size-4" /> {clock(remaining)}
        </div>
      </div>

      <Card className={inUploadWindow ? "border-secondary" : ""}>
        <CardContent className="flex items-start gap-2 p-4 text-sm">
          {inUploadWindow ? (
            <>
              <Upload className="mt-0.5 size-4 shrink-0 text-secondary" />
              <p><b className="text-secondary">আপলোডের সময় চলছে।</b> কাগজে লেখা উত্তরের ছবি/স্ক্যান PDF হিসেবে প্রতিটি প্রশ্নের নিচে আপলোড করুন।</p>
            </>
          ) : (
            <>
              <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
              <p>প্রশ্নগুলোর উত্তর কাগজে লিখুন। পরীক্ষার সময় শেষে {Math.round(uploadWindow / 60)} মিনিটের আপলোড উইন্ডো পাবেন। চাইলে এখনই আপলোড করতে পারেন।</p>
            </>
          )}
        </CardContent>
      </Card>

      {exam.questions.map((q) => {
        const f = files[q.id];
        return (
          <Card key={q.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{q.order + 1}. {q.promptBn}</p>
                <Badge variant="outline" className="shrink-0">{q.marks} নম্বর</Badge>
              </div>

              <div className="mt-3">
                {!f ? (
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/40">
                    <Upload className="size-4" /> উত্তরপত্র PDF আপলোড করুন
                    <input type="file" accept="application/pdf" hidden onChange={(e) => handleFile(q.id, e.target.files?.[0])} />
                  </label>
                ) : f.uploading ? (
                  <div className="rounded-xl border bg-muted/40 p-3">
                    <div className="mb-1.5 flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin text-primary" /> আপলোড হচ্ছে… {f.progress}%</div>
                    <Progress value={f.progress} />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl border border-accent bg-accent/10 p-3 text-sm">
                    <CheckCircle2 className="size-4 shrink-0 text-accent" />
                    <span className="flex-1 truncate">{f.name}</span>
                    <button onClick={() => setFiles((p) => { const n = { ...p }; delete n[q.id]; return n; })} className="text-muted-foreground hover:text-destructive">
                      <X className="size-4" />
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <AlertTriangle className="size-4" /> জমা দেওয়ার পর আর পরিবর্তন করা যাবে না।
        </p>
        <Button size="lg" onClick={() => submit(false)} disabled={submitting}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} জমা দিন
        </Button>
      </div>
    </div>
  );
}
