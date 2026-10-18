"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { get, post, patch } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";

// Local datetime → ISO helper
const toLocalInput = (d) => (d ? new Date(d).toISOString().slice(0, 16) : "");

export function ExamForm({ initial, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [f, setF] = useState({
    type: initial?.type ?? "PRACTICE",
    titleBn: initial?.titleBn ?? "",
    titleEn: initial?.titleEn ?? "",
    descriptionBn: initial?.descriptionBn ?? "",
    categoryId: initial?.categoryId ?? "",
    durationMinutes: initial?.durationMinutes ?? 30,
    passMark: initial?.passMark ?? 0,
    negativeMarking: initial?.negativeMarking ?? 0.25,
    instantResult: initial?.instantResult ?? false,
    startAt: toLocalInput(initial?.startAt),
    endAt: toLocalInput(initial?.endAt),
  });

  useEffect(() => { get("/api/v1/taxonomy").then((t) => setCategories(t)).catch(() => {}); }, []);

  function set(k, v) { setF((s) => ({ ...s, [k]: v })); }

  async function submit() {
    if (!f.titleEn && !f.titleBn) return toast.error("শিরোনাম দিন");
    if (f.type === "LIVE" && (!f.startAt || !f.endAt)) return toast.error("লাইভ পরীক্ষার সময় দিন");

    const payload = {
      type: f.type,
      titleEn: f.titleEn || f.titleBn,
      titleBn: f.titleBn || null,
      descriptionBn: f.descriptionBn || null,
      categoryId: f.categoryId || null,
      durationMinutes: Number(f.durationMinutes),
      passMark: Number(f.passMark),
      negativeMarking: Number(f.negativeMarking),
      instantResult: f.instantResult,
      startAt: f.type === "LIVE" && f.startAt ? new Date(f.startAt).toISOString() : null,
      endAt: f.type === "LIVE" && f.endAt ? new Date(f.endAt).toISOString() : null,
    };

    setSaving(true);
    try {
      if (initial?.id) await patch(`/api/v1/admin/exams/${initial.id}`, payload);
      else await post("/api/v1/admin/exams", payload);
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
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="ধরন">
          <Select value={f.type} onValueChange={(v) => set("type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PRACTICE">প্র্যাকটিস (যেকোনো সময়)</SelectItem>
              <SelectItem value="LIVE">লাইভ (নির্দিষ্ট সময়)</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="ক্যাটাগরি">
          <Select value={f.categoryId || "none"} onValueChange={(v) => set("categoryId", v === "none" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="সাধারণ" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">সাধারণ</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.nameBn}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="শিরোনাম (বাংলা)"><Input value={f.titleBn} onChange={(e) => set("titleBn", e.target.value)} placeholder="47তম বিসিএস মক টেস্ট" /></Field>
      <Field label="শিরোনাম (English)"><Input value={f.titleEn} onChange={(e) => set("titleEn", e.target.value)} placeholder="47th BCS Mock Test" /></Field>
      <Field label="বিবরণ"><Textarea value={f.descriptionBn} onChange={(e) => set("descriptionBn", e.target.value)} /></Field>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="সময় (মিনিট)"><Input type="number" value={f.durationMinutes} onChange={(e) => set("durationMinutes", e.target.value)} /></Field>
        <Field label="পাস মার্ক"><Input type="number" step="0.5" value={f.passMark} onChange={(e) => set("passMark", e.target.value)} /></Field>
        <Field label="নেগেটিভ মার্ক"><Input type="number" step="0.05" value={f.negativeMarking} onChange={(e) => set("negativeMarking", e.target.value)} /></Field>
      </div>

      {f.type === "LIVE" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="শুরুর সময়"><Input type="datetime-local" value={f.startAt} onChange={(e) => set("startAt", e.target.value)} /></Field>
          <Field label="শেষের সময়"><Input type="datetime-local" value={f.endAt} onChange={(e) => set("endAt", e.target.value)} /></Field>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={f.instantResult} onChange={(e) => set("instantResult", e.target.checked)} className="size-4 accent-[var(--primary)]" />
        সাবমিটের পরপরই ফলাফল দেখান (লাইভ পরীক্ষায় মেধাতালিকা আলাদা)
      </label>

      <DialogFooter>
        <Button onClick={submit} disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />} সংরক্ষণ
        </Button>
      </DialogFooter>
    </div>
  );
}

function Field({ label, children }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
