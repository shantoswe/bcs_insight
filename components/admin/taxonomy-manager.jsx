"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Pencil } from "lucide-react";
import { get, post, patch, del } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";

// Category fields. The last four drive the home-page category card
// (হোম পেজে ক্যাটাগরি কার্ড), which links to /courses?category=<slug>.
const CATEGORY_FIELDS = [
  ["nameBn", "নাম (বাংলা)"],
  ["nameEn", "নাম (English)"],
  ["icon", "আইকন (ইমোজি)"],
  ["order", "ক্রম", "number"],
  ["showOnHome", "হোম পেজে কার্ড দেখাও", "checkbox"],
  ["color", "কার্ডের রঙ", "select", [
    ["navy", "নেভি"], ["blue", "নীল"], ["maroon", "মেরুন"], ["amber", "অ্যাম্বার"], ["green", "সবুজ"],
  ]],
  ["imageUrl", "কার্ডের ছবি (URL — ফাইল ম্যানেজার থেকে কপি করুন)"],
  ["highlights", "কার্ডের পয়েন্ট (প্রতি লাইনে একটি)", "lines"],
];

export function TaxonomyManager() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catId, setCatId] = useState("");
  const [subId, setSubId] = useState("");

  async function reload() {
    try {
      const t = await get("/api/v1/taxonomy");
      setTree(t);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { reload(); }, []);

  const category = tree.find((c) => c.id === catId);
  const subjects = category?.subjects ?? [];
  const subject = subjects.find((s) => s.id === subId);
  const topics = subject?.topics ?? [];

  if (loading)
    return <div className="flex justify-center py-16"><Loader2 className="size-7 animate-spin text-primary" /></div>;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Categories */}
      <Column
        title="ক্যাটাগরি"
        addLabel="নতুন ক্যাটাগরি"
        fields={CATEGORY_FIELDS}
        onCreate={(data) => post("/api/v1/admin/categories", data).then(reload)}
        items={tree.map((c) => ({ id: c.id, label: `${c.icon ?? "📚"} ${c.nameBn}`, sub: c.nameEn, raw: c }))}
        selectedId={catId}
        onSelect={(id) => { setCatId(id); setSubId(""); }}
        onEdit={(id, data) => patch(`/api/v1/admin/categories/${id}`, data).then(reload)}
        onDelete={(id) => del(`/api/v1/admin/categories/${id}`).then(reload)}
      />

      {/* Subjects */}
      <Column
        title="বিষয়"
        addLabel="নতুন বিষয়"
        disabled={!catId}
        emptyHint={!catId ? "প্রথমে একটি ক্যাটাগরি বেছে নিন" : "কোনো বিষয় নেই"}
        fields={[["nameBn", "নাম (বাংলা)"], ["nameEn", "নাম (English)"]]}
        onCreate={(data) => post("/api/v1/admin/subjects", { ...data, categoryId: catId }).then(reload)}
        items={subjects.map((s) => ({ id: s.id, label: s.nameBn, sub: s.nameEn, raw: s }))}
        selectedId={subId}
        onSelect={setSubId}
        onEdit={(id, data) => patch(`/api/v1/admin/subjects/${id}`, data).then(reload)}
        onDelete={(id) => del(`/api/v1/admin/subjects/${id}`).then(reload)}
      />

      {/* Topics */}
      <Column
        title="টপিক"
        addLabel="নতুন টপিক"
        disabled={!subId}
        emptyHint={!subId ? "প্রথমে একটি বিষয় বেছে নিন" : "কোনো টপিক নেই"}
        fields={[["nameBn", "নাম (বাংলা)"], ["nameEn", "নাম (English)"]]}
        onCreate={(data) => post("/api/v1/admin/topics", { ...data, subjectId: subId }).then(reload)}
        items={topics.map((t) => ({ id: t.id, label: t.nameBn, sub: t.nameEn, raw: t }))}
        onEdit={(id, data) => patch(`/api/v1/admin/topics/${id}`, data).then(reload)}
        onDelete={(id) => del(`/api/v1/admin/topics/${id}`).then(reload)}
      />
    </div>
  );
}

function Column({
  title, addLabel, fields, onCreate, items, selectedId, onSelect, onEdit, onDelete, disabled, emptyHint,
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          {!disabled && <EntityDialog trigger={<Button size="sm" variant="outline"><Plus className="size-4" /></Button>} title={addLabel} fields={fields} onSubmit={onCreate} />}
        </div>
        {disabled ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{emptyHint}</p>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{emptyHint ?? "কিছু নেই"}</p>
        ) : (
          <div className="space-y-1">
            {items.map((it) => (
              <div
                key={it.id}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${selectedId === it.id ? "border-primary bg-primary/8" : ""} ${onSelect ? "cursor-pointer" : ""}`}
                onClick={() => onSelect?.(it.id)}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{it.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{it.sub}</p>
                </div>
                <EntityDialog
                  trigger={<button className="text-muted-foreground hover:text-primary" onClick={(e) => e.stopPropagation()}><Pencil className="size-3.5" /></button>}
                  title={`${title} সম্পাদনা`}
                  fields={fields}
                  initial={it.raw}
                  onSubmit={(data) => onEdit(it.id, data)}
                />
                <button
                  className="text-muted-foreground hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); if (confirm("মুছে ফেলবেন? সম্পর্কিত সব ডেটা মুছে যাবে।")) onDelete(it.id).catch((err) => toast.error(err.message)); }}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EntityDialog({ trigger, title, fields, initial, onSubmit }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(Object.fromEntries(fields.map(([k, , type]) => {
      const v = initial?.[k];
      if (type === "checkbox") return [k, v ?? true];
      if (type === "lines") return [k, (v ?? []).join("\n")];
      return [k, v ?? ""];
    })));
  }, [open]); // eslint-disable-line

  async function submit() {
    setSaving(true);
    try {
      // turn the UI shapes back into what the API validators expect
      const payload = { ...form };
      for (const [k, , type] of fields) {
        if (type === "lines")
          payload[k] = String(payload[k] ?? "").split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 8);
        if (type === "checkbox") payload[k] = !!payload[k];
        if (type === "number") payload[k] = Number(payload[k] || 0);
        if (payload[k] === "") delete payload[k];
      }
      await onSubmit(payload);
      toast.success("সংরক্ষিত হয়েছে");
      setOpen(false);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {fields.map(([key, label, type, options]) => (
            <div key={key} className="space-y-1.5">
              {type === "checkbox" ? (
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--primary)]"
                    checked={!!form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                  />
                  {label}
                </label>
              ) : (
                <>
                  <Label>{label}</Label>
                  {type === "select" ? (
                    <Select value={form[key] || options[0][0]} onValueChange={(v) => setForm({ ...form, [key]: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : type === "lines" ? (
                    <textarea
                      rows={4}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                      value={form[key] ?? ""}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                  ) : (
                    <Input
                      type={type === "number" ? "number" : "text"}
                      value={form[key] ?? ""}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                  )}
                </>
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />} সংরক্ষণ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
