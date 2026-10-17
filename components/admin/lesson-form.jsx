"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { post, patch } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { BunnyUpload } from "@/components/admin/bunny-upload";

const TYPES = [
  ["VIDEO", "ভিডিও (Bunny)"],
  ["PDF", "PDF"],
  ["RESOURCE", "রিসোর্স লিংক"],
  ["LIVE_CLASS", "লাইভ ক্লাস লিংক"],
];

export function LessonForm({ sectionId, initial, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState(initial?.type ?? "VIDEO");
  const [titleBn, setTitleBn] = useState(initial?.titleBn ?? "");
  const [titleEn, setTitleEn] = useState(initial?.titleEn ?? "");
  const [bunnyVideoId, setBunnyVideoId] = useState(initial?.bunnyVideoId ?? "");
  const [linkUrl, setLinkUrl] = useState(initial?.linkUrl ?? "");
  const [filePath, setFilePath] = useState(initial?.filePath ?? "");
  const [isFreePreview, setIsFreePreview] = useState(initial?.isFreePreview ?? false);

  async function submit() {
    if (!titleBn && !titleEn) return toast.error("লেসনের শিরোনাম দিন");
    const payload = {
      type,
      titleEn: titleEn || titleBn,
      titleBn: titleBn || null,
      bunnyVideoId: type === "VIDEO" ? bunnyVideoId || null : null,
      videoStatus: type === "VIDEO" && bunnyVideoId ? "PROCESSING" : "NONE",
      linkUrl: type === "RESOURCE" || type === "LIVE_CLASS" ? linkUrl || null : null,
      filePath: type === "PDF" ? filePath || null : null,
      isFreePreview,
    };
    setSaving(true);
    try {
      if (initial?.id) await patch(`/api/v1/admin/lessons/${initial.id}`, payload);
      else await post("/api/v1/admin/lessons", { sectionId, ...payload });
      toast.success("লেসন সংরক্ষিত হয়েছে");
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
          <Label>ধরন</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{TYPES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>শিরোনাম (বাংলা)</Label><Input value={titleBn} onChange={(e) => setTitleBn(e.target.value)} /></div>
      </div>

      {type === "VIDEO" && (
        <div className="space-y-2">
          <Label>ভিডিও</Label>
          {bunnyVideoId ? (
            <div className="flex items-center gap-2 rounded-lg border border-accent bg-accent/10 p-3 text-sm">
              <CheckCircle2 className="size-4 text-accent" />
              <span className="flex-1 truncate">ভিডিও সংযুক্ত: <code className="text-xs">{bunnyVideoId}</code></span>
              <button className="text-xs text-muted-foreground hover:text-destructive" onClick={() => setBunnyVideoId("")}>সরান</button>
            </div>
          ) : (
            <BunnyUpload onUploaded={setBunnyVideoId} />
          )}
          <Input placeholder="অথবা বিদ্যমান Bunny ভিডিও GUID পেস্ট করুন" value={bunnyVideoId} onChange={(e) => setBunnyVideoId(e.target.value)} />
        </div>
      )}

      {(type === "RESOURCE" || type === "LIVE_CLASS") && (
        <div className="space-y-1.5"><Label>লিংক</Label><Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." /></div>
      )}
      {type === "PDF" && (
        <div className="space-y-1.5"><Label>PDF URL</Label><Input value={filePath} onChange={(e) => setFilePath(e.target.value)} placeholder="https://... বা storage path" /></div>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isFreePreview} onChange={(e) => setIsFreePreview(e.target.checked)} className="size-4 accent-[oklch(0.52_0.24_292)]" />
        ফ্রি প্রিভিউ (ভর্তি ছাড়াই দেখা যাবে)
      </label>

      <DialogFooter>
        <Button onClick={submit} disabled={saving}>{saving && <Loader2 className="size-4 animate-spin" />} সংরক্ষণ</Button>
      </DialogFooter>
    </div>
  );
}
