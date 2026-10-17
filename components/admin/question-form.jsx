"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, X, Check, ImagePlus, Trash2 } from "lucide-react";
import { post, patch } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";

const blankOption = () => ({ textBn: "", imagePath: "", isCorrect: false });

export function QuestionForm({ tree, initial, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [subjectId, setSubjectId] = useState(initial?.subjectId ?? "");
  const [topicId, setTopicId] = useState(initial?.topicId ?? "");
  const [textBn, setTextBn] = useState(initial?.textBn ?? "");
  const [imagePath, setImagePath] = useState(initial?.imagePath || initial?.imageUrl || "");
  const [explanationBn, setExplanationBn] = useState(initial?.explanationBn ?? "");
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? "MEDIUM");
  const [source, setSource] = useState(initial?.source ?? "");
  const [options, setOptions] = useState(
    initial?.options?.map((o) => ({ textBn: o.textBn || "", imagePath: o.imagePath || o.imageUrl || "", isCorrect: o.isCorrect })) ?? [
      blankOption(), blankOption(), blankOption(), blankOption(),
    ]
  );

  useEffect(() => {
    if (initial?.subjectId) {
      const cat = tree.find((c) => c.subjects.some((s) => s.id === initial.subjectId));
      if (cat) setCategoryId(cat.id);
    }
  }, [initial, tree]);

  const subjects = tree.find((c) => c.id === categoryId)?.subjects ?? [];
  const topics = subjects.find((s) => s.id === subjectId)?.topics ?? [];

  const setCorrect = (i) => setOptions((os) => os.map((o, idx) => ({ ...o, isCorrect: idx === i })));
  const setOpt = (i, patch) => setOptions((os) => os.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));

  async function submit() {
    if (!subjectId) return toast.error("বিষয় নির্বাচন করুন");
    if (!textBn.trim() && !imagePath) return toast.error("প্রশ্নে টেক্সট বা ছবি দিন");
    const filled = options.filter((o) => o.textBn.trim() || o.imagePath);
    if (filled.length < 2) return toast.error("কমপক্ষে ২টি অপশন দিন");
    if (filled.filter((o) => o.isCorrect).length !== 1) return toast.error("একটি সঠিক উত্তর নির্বাচন করুন");

    const payload = {
      subjectId,
      topicId: topicId || null,
      textBn: textBn.trim(),
      imagePath: imagePath || null,
      explanationBn: explanationBn.trim() || null,
      difficulty,
      source: source.trim() || null,
      options: filled.map((o) => ({ textBn: o.textBn.trim(), imagePath: o.imagePath || null, isCorrect: o.isCorrect })),
    };

    setSaving(true);
    try {
      if (initial?.id) await patch(`/api/v1/admin/questions/${initial.id}`, payload);
      else await post("/api/v1/admin/questions", payload);
      toast.success("সংরক্ষিত হয়েছে");
      onSaved?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="ক্যাটাগরি">
          <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setSubjectId(""); setTopicId(""); }}>
            <SelectTrigger><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
            <SelectContent>{tree.map((c) => <SelectItem key={c.id} value={c.id}>{c.nameBn}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="বিষয় *">
          <Select value={subjectId} onValueChange={(v) => { setSubjectId(v); setTopicId(""); }} disabled={!categoryId}>
            <SelectTrigger><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
            <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.nameBn}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="টপিক">
          <Select value={topicId} onValueChange={setTopicId} disabled={!subjectId}>
            <SelectTrigger><SelectValue placeholder="নির্বাচন" /></SelectTrigger>
            <SelectContent>{topics.map((t) => <SelectItem key={t.id} value={t.id}>{t.nameBn}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="প্রশ্ন *">
        <Textarea value={textBn} onChange={(e) => setTextBn(e.target.value)} placeholder="প্রশ্ন লিখুন..." />
        <p className="mt-1 text-[11px] text-muted-foreground">
          গণিত/সমীকরণ: <code>$x^2+y^2$</code> · সাবস্ক্রিপ্ট: <code>H&lt;sub&gt;2&lt;/sub&gt;O</code> · সুপারস্ক্রিপ্ট: <code>x&lt;sup&gt;2&lt;/sup&gt;</code>
        </p>
        <ImageUpload value={imagePath} onChange={setImagePath} label="প্রশ্নের ছবি" />
      </Field>

      <div>
        <Label className="mb-2 block">অপশন (সঠিকটিতে ✓ দিন · টেক্সট অথবা ছবি)</Label>
        <div className="space-y-3">
          {options.map((o, i) => (
            <div key={i} className="rounded-lg border p-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrect(i)}
                  className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg border-2", o.isCorrect ? "border-accent bg-accent text-white" : "border-border")}
                  title="সঠিক উত্তর"
                >
                  {o.isCorrect ? <Check className="size-4" /> : String.fromCharCode(65 + i)}
                </button>
                <Input value={o.textBn} onChange={(e) => setOpt(i, { textBn: e.target.value })} placeholder={`অপশন ${String.fromCharCode(65 + i)}`} />
                {options.length > 2 && (
                  <button type="button" onClick={() => setOptions((os) => os.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive"><X className="size-4" /></button>
                )}
              </div>
              <div className="pl-10 pt-2">
                <ImageUpload value={o.imagePath} onChange={(v) => setOpt(i, { imagePath: v })} label="অপশনের ছবি" small />
              </div>
            </div>
          ))}
        </div>
        {options.length < 5 && (
          <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setOptions((os) => [...os, blankOption()])}>
            <Plus className="size-4" /> অপশন যোগ
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="কঠিনতা">
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="EASY">সহজ</SelectItem>
              <SelectItem value="MEDIUM">মাঝারি</SelectItem>
              <SelectItem value="HARD">কঠিন</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="উৎস (ঐচ্ছিক)">
          <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="35th BCS" />
        </Field>
      </div>

      <Field label="ব্যাখ্যা (ঐচ্ছিক)">
        <Textarea value={explanationBn} onChange={(e) => setExplanationBn(e.target.value)} placeholder="সঠিক উত্তরের ব্যাখ্যা..." />
      </Field>

      <DialogFooter>
        <Button onClick={submit} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />} সংরক্ষণ করুন
        </Button>
      </DialogFooter>
    </div>
  );
}

function Field({ label, children }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

// Upload an image to the public files bucket; stores the returned URL.
export function ImageUpload({ value, onChange, label = "ছবি", small }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "question-images");
      const { url } = await post("/api/v1/admin/files", fd);
      onChange(url);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }
  if (value) {
    return (
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="" className={cn("rounded border object-contain", small ? "h-12" : "max-h-28")} />
        <button type="button" onClick={() => onChange("")} className="text-muted-foreground hover:text-destructive" title="ছবি সরান"><Trash2 className="size-4" /></button>
      </div>
    );
  }
  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => ref.current?.click()} disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />} {label}
      </Button>
      <input ref={ref} type="file" accept="image/*" hidden onChange={upload} />
    </>
  );
}
