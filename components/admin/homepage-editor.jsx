"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Plus, Trash2, Upload, ImageIcon, Video, Megaphone, Star, LineChart, Wallet } from "lucide-react";
import { get, patch, post } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const uid = () => Math.random().toString(36).slice(2, 9);

export function HomepageEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [s, setS] = useState({});

  useEffect(() => {
    get("/api/v1/admin/settings").then(setS).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  function set(key, val) { setS((p) => ({ ...p, [key]: val })); }

  async function save() {
    setSaving(true);
    try {
      const keys = [
        "siteName", "tagline", "logoUrl", "faviconUrl",
        "seoTitle", "seoDescription", "seoKeywords", "ogImageUrl",
        "heroBadge", "heroTitle", "heroSubtitle", "heroCtaText", "heroCtaUrl", "home.hero.points",
        "home.videos", "home.banners", "home.testimonials",
        "tracking.metaPixelId", "tracking.gaMeasurementId", "tracking.gtmId",
        "payment.instructions", "payment.methods",
      ];
      const arrayKeys = new Set(["home.videos", "home.banners", "home.testimonials", "payment.methods"]);
      const patchBody = Object.fromEntries(keys.map((k) => [k, s[k] ?? (arrayKeys.has(k) ? [] : "")]));
      await patch("/api/v1/admin/settings", patchBody);
      toast.success("সংরক্ষিত হয়েছে");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="size-7 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 pb-24">
      {/* Identity + SEO */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="size-5 text-primary" /> পরিচয় ও SEO</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="সাইটের নাম" value={s.siteName} onChange={(v) => set("siteName", v)} />
          <Field label="ট্যাগলাইন" value={s.tagline} onChange={(v) => set("tagline", v)} />
          <ImageField label="লোগো" value={s.logoUrl} onChange={(v) => set("logoUrl", v)} />
          <ImageField label="ফেভিকন" value={s.faviconUrl} onChange={(v) => set("faviconUrl", v)} />
          <Field label="SEO টাইটেল" value={s.seoTitle} onChange={(v) => set("seoTitle", v)} className="sm:col-span-2" />
          <TextareaField label="SEO বিবরণ (meta description)" value={s.seoDescription} onChange={(v) => set("seoDescription", v)} className="sm:col-span-2" />
          <Field label="SEO কীওয়ার্ড (কমা দিয়ে)" value={s.seoKeywords} onChange={(v) => set("seoKeywords", v)} className="sm:col-span-2" />
          <ImageField label="OG শেয়ার ইমেজ (1200×630)" value={s.ogImageUrl} onChange={(v) => set("ogImageUrl", v)} className="sm:col-span-2" />
        </CardContent>
      </Card>

      {/* Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><LineChart className="size-5 text-accent-foreground" /> ট্র্যাকিং (Meta ও Google)</CardTitle>
          <p className="text-sm text-muted-foreground">পাবলিক আইডি এখানে দিন। সিক্রেট টোকেন (CAPI টোকেন, GA API secret) সার্ভারের .env ফাইলে থাকে।</p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Meta Pixel ID" value={s["tracking.metaPixelId"]} onChange={(v) => set("tracking.metaPixelId", v)} placeholder="1234567890" />
          <Field label="GA4 Measurement ID" value={s["tracking.gaMeasurementId"]} onChange={(v) => set("tracking.gaMeasurementId", v)} placeholder="G-XXXXXXXXXX" />
          <Field label="GTM Container ID" value={s["tracking.gtmId"]} onChange={(v) => set("tracking.gtmId", v)} placeholder="GTM-XXXXXXX" />
        </CardContent>
      </Card>

      {/* Payment methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wallet className="size-5 text-accent-foreground" /> পেমেন্ট (বিকাশ / নগদ / রকেট)</CardTitle>
          <p className="text-sm text-muted-foreground">পেইড কোর্সে শিক্ষার্থীরা এই নম্বরগুলোতে টাকা পাঠাবে, তারপর শেষ ৪ সংখ্যা জমা দেবে।</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <TextareaField label="পেমেন্ট নির্দেশনা" value={s["payment.instructions"]} onChange={(v) => set("payment.instructions", v)} />
        </CardContent>
      </Card>
      <ListEditor
        icon={Wallet}
        title="পেমেন্ট নম্বর"
        hint="যত খুশি নম্বর যোগ করুন — শিক্ষার্থীর পেমেন্ট পপআপে দেখাবে।"
        items={s["payment.methods"] ?? []}
        onChange={(v) => set("payment.methods", v)}
        blank={() => ({ id: uid(), method: "BKASH", number: "", accountType: "Personal", active: true })}
        render={(it, upd) => (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">মাধ্যম</Label>
              <Select value={it.method} onValueChange={(v) => upd({ ...it, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[["BKASH", "বিকাশ"], ["NAGAD", "নগদ"], ["ROCKET", "রকেট"], ["UPAY", "উপায়"], ["OTHER", "অন্যান্য"]].map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Field label="নম্বর" value={it.number} onChange={(v) => upd({ ...it, number: v })} placeholder="01XXXXXXXXX" />
            <div className="space-y-1.5">
              <Label className="text-xs">অ্যাকাউন্ট টাইপ</Label>
              <Select value={it.accountType} onValueChange={(v) => upd({ ...it, accountType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Personal", "Merchant", "Agent", "Send Money"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 pt-6 text-sm">
              <input type="checkbox" checked={it.active !== false} onChange={(e) => upd({ ...it, active: e.target.checked })} className="size-4 accent-[oklch(0.52_0.24_292)]" /> সক্রিয়
            </label>
          </>
        )}
      />

      {/* Hero */}
      <Card>
        <CardHeader><CardTitle>হিরো সেকশন</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="ব্যাজ টেক্সট" value={s.heroBadge} onChange={(v) => set("heroBadge", v)} className="sm:col-span-2" />
          <Field label="শিরোনাম" value={s.heroTitle} onChange={(v) => set("heroTitle", v)} className="sm:col-span-2" />
          <TextareaField label="সাবটাইটেল" value={s.heroSubtitle} onChange={(v) => set("heroSubtitle", v)} className="sm:col-span-2" />
          <TextareaField label="পয়েন্ট তালিকা (প্রতি লাইনে একটি)" value={s["home.hero.points"]} onChange={(v) => set("home.hero.points", v)} className="sm:col-span-2" />
          <Field label="বাটন টেক্সট" value={s.heroCtaText} onChange={(v) => set("heroCtaText", v)} />
          <Field label="বাটন লিংক" value={s.heroCtaUrl} onChange={(v) => set("heroCtaUrl", v)} />
        </CardContent>
      </Card>

      {/* Videos */}
      <ListEditor
        icon={Video}
        title="ভিডিও স্লাইডার"
        hint="YouTube বা Bunny ভিডিও লিংক যোগ করুন — হোমপেজে স্লাইডার হিসেবে দেখাবে।"
        items={s["home.videos"] ?? []}
        onChange={(v) => set("home.videos", v)}
        blank={() => ({ id: uid(), title: "", url: "" })}
        render={(it, upd) => (
          <>
            <Field label="শিরোনাম" value={it.title} onChange={(v) => upd({ ...it, title: v })} />
            <Field label="ভিডিও URL" value={it.url} onChange={(v) => upd({ ...it, url: v })} placeholder="https://youtube.com/watch?v=..." />
          </>
        )}
      />

      {/* Banners */}
      <ListEditor
        icon={Megaphone}
        title="ঘোষণা ব্যানার"
        hint="হোমপেজের উপরে ঘূর্ণায়মান ঘোষণা।"
        items={s["home.banners"] ?? []}
        onChange={(v) => set("home.banners", v)}
        blank={() => ({ id: uid(), title: "", body: "", ctaText: "", ctaUrl: "", color: "primary", active: true })}
        render={(it, upd) => (
          <>
            <Field label="শিরোনাম" value={it.title} onChange={(v) => upd({ ...it, title: v })} />
            <Field label="বার্তা" value={it.body} onChange={(v) => upd({ ...it, body: v })} />
            <Field label="বাটন টেক্সট" value={it.ctaText} onChange={(v) => upd({ ...it, ctaText: v })} />
            <Field label="বাটন লিংক" value={it.ctaUrl} onChange={(v) => upd({ ...it, ctaUrl: v })} />
            <div className="space-y-1.5">
              <Label className="text-xs">রঙ</Label>
              <Select value={it.color} onValueChange={(v) => upd({ ...it, color: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">ইন্ডিগো</SelectItem>
                  <SelectItem value="coral">কোরাল</SelectItem>
                  <SelectItem value="emerald">সবুজ</SelectItem>
                  <SelectItem value="gold">সোনালি</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 pt-6 text-sm">
              <input type="checkbox" checked={it.active !== false} onChange={(e) => upd({ ...it, active: e.target.checked })} className="size-4 accent-[oklch(0.52_0.24_292)]" /> সক্রিয়
            </label>
          </>
        )}
      />

      {/* Testimonials */}
      <ListEditor
        icon={Star}
        title="রিভিউ / প্রশংসাপত্র"
        hint="শিক্ষার্থীদের মতামত।"
        items={s["home.testimonials"] ?? []}
        onChange={(v) => set("home.testimonials", v)}
        blank={() => ({ id: uid(), name: "", role: "", text: "", rating: 5 })}
        render={(it, upd) => (
          <>
            <Field label="নাম" value={it.name} onChange={(v) => upd({ ...it, name: v })} />
            <Field label="পরিচয় / পদবি" value={it.role} onChange={(v) => upd({ ...it, role: v })} />
            <TextareaField label="মন্তব্য" value={it.text} onChange={(v) => upd({ ...it, text: v })} className="sm:col-span-2" />
            <div className="space-y-1.5">
              <Label className="text-xs">রেটিং</Label>
              <Select value={String(it.rating ?? 5)} onValueChange={(v) => upd({ ...it, rating: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[5, 4, 3, 2, 1].map((n) => <SelectItem key={n} value={String(n)}>{n} ★</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </>
        )}
      />

      {/* sticky save */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-card/95 p-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-3xl justify-end">
          <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} সব সংরক্ষণ করুন</Button>
        </div>
      </div>
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
function TextareaField({ label, value, onChange, className }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs">{label}</Label>
      <Textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ImageField({ label, value, onChange, className }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "site");
      const { url } = await post("/api/v1/admin/files", fd);
      onChange(url);
      toast.success("আপলোড হয়েছে");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="size-10 rounded border object-cover" />
        )}
        <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="URL বা আপলোড" className="flex-1" />
        <Button type="button" variant="outline" size="icon" onClick={() => ref.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        </Button>
        <input ref={ref} type="file" accept="image/*" hidden onChange={upload} />
      </div>
    </div>
  );
}

function ListEditor({ icon: Icon, title, hint, items, onChange, blank, render }) {
  function update(i, val) { onChange(items.map((x, idx) => (idx === i ? val : x))); }
  function remove(i) { onChange(items.filter((_, idx) => idx !== i)); }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Icon className="size-5 text-secondary" /> {title}</CardTitle>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">কিছু যোগ করা হয়নি।</p>}
        {items.map((it, i) => (
          <div key={it.id ?? i} className="relative grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
            {render(it, (val) => update(i, val))}
            <button onClick={() => remove(i)} className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => onChange([...items, blank()])}><Plus className="size-4" /> যোগ করুন</Button>
      </CardContent>
    </Card>
  );
}
