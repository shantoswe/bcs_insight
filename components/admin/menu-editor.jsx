"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Loader2, Save, Plus, Trash2, ChevronUp, ChevronDown, Menu as MenuIcon, PanelBottom, Link2,
} from "lucide-react";
import { get, patch } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const uid = () => Math.random().toString(36).slice(2, 9);

const KEYS = [
  "nav.menu",
  "header.searchPlaceholder", "header.loginText", "header.registerText",
  "header.dashboardText", "header.adminText",
  "footer.about", "footer.columns", "footer.contactTitle", "footer.copyright",
];
const ARRAY_KEYS = new Set(["nav.menu", "footer.columns"]);

// Header menu + footer columns. Items can be added, renamed, relinked,
// reordered and removed — nothing in the navigation is hard-coded.
export function MenuEditor() {
  const [s, setS] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    get("/api/v1/admin/settings").then(setS).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  function set(key, val) { setS((p) => ({ ...p, [key]: val })); }

  async function save() {
    setSaving(true);
    try {
      await patch("/api/v1/admin/settings",
        Object.fromEntries(KEYS.map((k) => [k, s[k] ?? (ARRAY_KEYS.has(k) ? [] : "")])));
      toast.success("সংরক্ষিত হয়েছে");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="size-7 animate-spin text-primary" /></div>;

  const menu = s["nav.menu"] ?? [];
  const columns = s["footer.columns"] ?? [];

  return (
    <div className="space-y-6 pb-24">
      {/* header menu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MenuIcon className="size-5 text-primary" /> হেডার মেনু</CardTitle>
          <p className="text-sm text-muted-foreground">যত খুশি মেনু যোগ করুন। লিংক সাইটের ভেতরের (/courses) বা বাইরের (https://...) হতে পারে।</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <LinkList
            items={menu}
            onChange={(v) => set("nav.menu", v)}
            addLabel="মেনু যোগ করুন"
          />
        </CardContent>
      </Card>

      {/* header labels */}
      <Card>
        <CardHeader><CardTitle>হেডারের লেখা</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="সার্চ প্লেসহোল্ডার" value={s["header.searchPlaceholder"]} onChange={(v) => set("header.searchPlaceholder", v)} className="sm:col-span-2" />
          <Field label="লগইন বাটন" value={s["header.loginText"]} onChange={(v) => set("header.loginText", v)} />
          <Field label="রেজিস্টার বাটন" value={s["header.registerText"]} onChange={(v) => set("header.registerText", v)} />
          <Field label="ড্যাশবোর্ড বাটন" value={s["header.dashboardText"]} onChange={(v) => set("header.dashboardText", v)} />
          <Field label="অ্যাডমিন লিংক" value={s["header.adminText"]} onChange={(v) => set("header.adminText", v)} />
        </CardContent>
      </Card>

      {/* footer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PanelBottom className="size-5 text-primary" /> ফুটার</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">ব্র্যান্ড পরিচিতি (লোগোর নিচের লেখা)</Label>
            <Textarea value={s["footer.about"] ?? ""} onChange={(e) => set("footer.about", e.target.value)} />
          </div>
          <Field label="যোগাযোগ কলামের শিরোনাম" value={s["footer.contactTitle"]} onChange={(v) => set("footer.contactTitle", v)} />
          <Field
            label="কপিরাইট লেখা"
            value={s["footer.copyright"]}
            onChange={(v) => set("footer.copyright", v)}
            placeholder="© {year} {siteName}. সর্বস্বত্ব সংরক্ষিত।"
          />
          <p className="text-xs text-muted-foreground sm:col-span-2">
            কপিরাইটে <code>{"{year}"}</code> লিখলে চলতি বছর এবং <code>{"{siteName}"}</code> লিখলে সাইটের নাম বসবে।
          </p>
        </CardContent>
      </Card>

      {/* footer columns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Link2 className="size-5 text-primary" /> ফুটার লিংক কলাম</CardTitle>
          <p className="text-sm text-muted-foreground">প্রতিটি কলামে আলাদা শিরোনাম ও যত খুশি লিংক দিতে পারেন।</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {columns.map((col, ci) => {
            const updCol = (next) => set("footer.columns", columns.map((c, i) => (i === ci ? next : c)));
            return (
              <div key={col.id ?? ci} className="rounded-xl border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Input
                    value={col.title ?? ""}
                    onChange={(e) => updCol({ ...col, title: e.target.value })}
                    placeholder="কলামের শিরোনাম"
                    className="font-semibold"
                  />
                  <Button variant="outline" size="icon" disabled={ci === 0}
                    onClick={() => set("footer.columns", move(columns, ci, -1))}><ChevronUp className="size-4" /></Button>
                  <Button variant="outline" size="icon" disabled={ci === columns.length - 1}
                    onClick={() => set("footer.columns", move(columns, ci, 1))}><ChevronDown className="size-4" /></Button>
                  <Button variant="outline" size="icon"
                    onClick={() => set("footer.columns", columns.filter((_, i) => i !== ci))}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
                <LinkList
                  items={col.links ?? []}
                  onChange={(links) => updCol({ ...col, links })}
                  addLabel="লিংক যোগ করুন"
                />
              </div>
            );
          })}
          <Button
            variant="outline"
            onClick={() => set("footer.columns", [...columns, { id: uid(), title: "", links: [] }])}
          >
            <Plus className="size-4" /> কলাম যোগ করুন
          </Button>
        </CardContent>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-card/95 p-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-3xl justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} সব সংরক্ষণ করুন
          </Button>
        </div>
      </div>
    </div>
  );
}

function move(arr, i, dir) {
  const next = [...arr];
  const j = i + dir;
  if (j < 0 || j >= next.length) return arr;
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

// Reusable label+href list with add / reorder / remove.
function LinkList({ items, onChange, addLabel }) {
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={it.id ?? i} className="flex flex-wrap items-center gap-2">
          <Input
            value={it.label ?? ""}
            onChange={(e) => onChange(items.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))}
            placeholder="মেনুর নাম"
            className="min-w-32 flex-1"
          />
          <Input
            value={it.href ?? ""}
            onChange={(e) => onChange(items.map((x, k) => (k === i ? { ...x, href: e.target.value } : x)))}
            placeholder="/courses"
            className="min-w-32 flex-1"
          />
          <Button variant="outline" size="icon" disabled={i === 0} onClick={() => onChange(move(items, i, -1))}>
            <ChevronUp className="size-4" />
          </Button>
          <Button variant="outline" size="icon" disabled={i === items.length - 1} onClick={() => onChange(move(items, i, 1))}>
            <ChevronDown className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => onChange(items.filter((_, k) => k !== i))}>
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...items, { id: uid(), label: "", href: "" }])}>
        <Plus className="size-4" /> {addLabel}
      </Button>
    </div>
  );
}

function Field({ label, value, onChange, className, placeholder }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs">{label}</Label>
      <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
