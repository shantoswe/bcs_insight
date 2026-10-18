"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload, ImageIcon } from "lucide-react";
import { get, post, patch } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";

const COURSE_TYPES = [
  { value: "PRELIMINARY", label: "প্রিলিমিনারি" },
  { value: "WRITTEN", label: "লিখিত" },
  { value: "EXAM", label: "পরীক্ষা" },
  { value: "GENERAL", label: "সাধারণ" },
];

export function CourseForm({ initial, onSaved }) {
  const isEdit = !!initial?.id;
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  useEffect(() => { get("/api/v1/admin/categories").then(setCategories).catch(() => {}); }, []);

  const [f, setF] = useState({
    courseType: initial?.courseType ?? "PRELIMINARY",
    categoryId: initial?.categoryId ?? "",
    titleBn: initial?.titleBn ?? "",
    titleEn: initial?.titleEn ?? "",
    descriptionBn: initial?.descriptionBn ?? "",
    thumbnailPath: initial?.thumbnailPath ?? "",
    isFree: initial?.isFree ?? true,
    priceBDT: initial?.priceBDT != null ? Number(initial.priceBDT) : 0,
    isPublished: initial?.isPublished ?? true,
  });

  function set(k, v) { setF((s) => ({ ...s, [k]: v })); }

  async function submit() {
    if (!f.titleBn && !f.titleEn) return toast.error("শিরোনাম দিন");
    const payload = {
      courseType: f.courseType,
      categoryId: f.categoryId || null,
      titleEn: f.titleEn || f.titleBn,
      titleBn: f.titleBn || null,
      descriptionBn: f.descriptionBn || null,
      thumbnailPath: f.thumbnailPath || null,
      isFree: f.isFree,
      priceBDT: f.isFree ? 0 : Number(f.priceBDT),
      isPublished: f.isPublished,
    };
    setSaving(true);
    try {
      if (isEdit) await patch(`/api/v1/admin/courses/${initial.id}`, payload);
      else await post("/api/v1/admin/courses", payload);
      toast.success(isEdit ? "কোর্স হালনাগাদ হয়েছে" : f.isPublished ? "কোর্স তৈরি ও প্রকাশিত হয়েছে" : "খসড়া তৈরি হয়েছে");
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
        <div className="space-y-1.5">
          <Label>কোর্সের ধরন</Label>
          <Select value={f.courseType} onValueChange={(v) => set("courseType", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{COURSE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>ক্যাটাগরি (BCS / ব্যাংক / প্রাথমিক …)</Label>
          <Select value={f.categoryId || "none"} onValueChange={(v) => set("categoryId", v === "none" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="নির্বাচন করুন" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">ক্যাটাগরি নেই</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.nameBn || c.nameEn}</SelectItem>)}
            </SelectContent>
          </Select>
          {categories.length === 0 && (
            <p className="text-[11px] text-muted-foreground">
              প্রথমে <b>বিষয় ও টপিক</b> পেজে ক্যাটাগরি যোগ করুন।
            </p>
          )}
        </div>
      </div>
      <div className="space-y-1.5"><Label>শিরোনাম (বাংলা)</Label><Input value={f.titleBn} onChange={(e) => set("titleBn", e.target.value)} /></div>
      <div className="space-y-1.5"><Label>শিরোনাম (English)</Label><Input value={f.titleEn} onChange={(e) => set("titleEn", e.target.value)} /></div>
      <div className="space-y-1.5"><Label>বিবরণ</Label><Textarea value={f.descriptionBn} onChange={(e) => set("descriptionBn", e.target.value)} /></div>

      <ThumbnailField value={f.thumbnailPath} onChange={(v) => set("thumbnailPath", v)} />

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={f.isFree} onChange={(e) => set("isFree", e.target.checked)} className="size-4 accent-[var(--primary)]" /> ফ্রি কোর্স
      </label>
      {!f.isFree && (
        <div className="space-y-1.5"><Label>মূল্য (৳)</Label><Input type="number" value={f.priceBDT} onChange={(e) => set("priceBDT", e.target.value)} /></div>
      )}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={f.isPublished} onChange={(e) => set("isPublished", e.target.checked)} className="size-4 accent-[var(--primary)]" /> প্রকাশিত (শিক্ষার্থীদের তালিকায় দেখাবে)
      </label>

      <DialogFooter>
        <Button onClick={submit} disabled={saving}>{saving && <Loader2 className="size-4 animate-spin" />} সংরক্ষণ করুন</Button>
      </DialogFooter>
    </div>
  );
}

function ThumbnailField({ value, onChange }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "course-thumbnails");
      const { url } = await post("/api/v1/admin/files", fd);
      onChange(url);
      toast.success("থাম্বনেইল আপলোড হয়েছে");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-1.5">
      <Label>থাম্বনেইল</Label>
      <div className="flex items-center gap-3">
        <div className="flex aspect-video w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <Button type="button" variant="outline" size="sm" onClick={() => ref.current?.click()} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} ছবি আপলোড
          </Button>
          <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="অথবা ছবির URL" className="text-xs" />
        </div>
      </div>
      <input ref={ref} type="file" accept="image/*" hidden onChange={upload} />
    </div>
  );
}
