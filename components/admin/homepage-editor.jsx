"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Save, Plus, Trash2, Upload, ImageIcon, Video, Megaphone, Star, LineChart, Wallet, Sparkles, BarChart3, GraduationCap, Newspaper, Phone, Tag, Type } from "lucide-react";
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
        "seoTitle", "seoDescription", "seoKeywords", "ogImageUrl",
        "heroBadge", "heroTitle", "heroTitleAccent", "heroSubtitle", "heroImageUrl",
        "heroSearchPlaceholder", "heroCtaText", "heroCtaUrl",
        "home.heroCardTitle", "home.heroCardAccent", "home.heroCardSubtitle",
        "home.heroCardCtaText", "home.heroCardCtaUrl",
        "home.coursesEyebrow", "home.coursesTitle", "home.coursesSubtitle",
        "home.coursesAllText", "home.coursesCardCtaText", "home.features",
        "home.videoEyebrow", "home.videoTitle",
        "home.reviewsEyebrow", "home.reviewsTitle",
        "home.blogEyebrow", "home.blogTitle", "home.blogAllText", "home.blogReadText",
        "home.newsletterTitle", "home.newsletterSubtitle",
        "home.newsletterPlaceholder", "home.newsletterButton",
        "home.chips", "home.stats", "home.blog", "home.promos",
        "home.videos", "home.banners", "home.testimonials",
        "contact.email", "contact.phone", "contact.address",
        "social.facebook", "social.instagram", "social.youtube", "social.whatsapp",
        "tracking.metaPixelId", "tracking.gaMeasurementId", "tracking.gtmId",
        "payment.instructions", "payment.methods",
      ];
      const arrayKeys = new Set(["home.videos", "home.banners", "home.testimonials", "payment.methods", "home.chips", "home.stats", "home.blog", "home.promos", "home.features"]);
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ImageIcon className="size-5 text-primary" /> SEO</CardTitle>
          <p className="text-sm text-muted-foreground">
            সাইটের নাম, লোগো ও ফেভিকন <Link href="/admin/settings" className="font-medium text-primary hover:underline">সেটিংস</Link> পেজে আছে।
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
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
              <input type="checkbox" checked={it.active !== false} onChange={(e) => upd({ ...it, active: e.target.checked })} className="size-4 accent-[var(--primary)]" /> সক্রিয়
            </label>
          </>
        )}
      />

      {/* Hero */}
      <Card>
        <CardHeader><CardTitle>হিরো সেকশন</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="ব্যাজ টেক্সট" value={s.heroBadge} onChange={(v) => set("heroBadge", v)} className="sm:col-span-2" />
          <Field label="শিরোনাম (১ম লাইন)" value={s.heroTitle} onChange={(v) => set("heroTitle", v)} />
          <Field label="শিরোনাম (২য় লাইন — সবুজ)" value={s.heroTitleAccent} onChange={(v) => set("heroTitleAccent", v)} />
          <TextareaField label="সাবটাইটেল" value={s.heroSubtitle} onChange={(v) => set("heroSubtitle", v)} className="sm:col-span-2" />
          <ImageField label="হিরো ছবি (ডানপাশে দেখাবে)" value={s.heroImageUrl} onChange={(v) => set("heroImageUrl", v)} className="sm:col-span-2" />
          <Field label="সার্চ বক্সের প্লেসহোল্ডার" value={s.heroSearchPlaceholder} onChange={(v) => set("heroSearchPlaceholder", v)} className="sm:col-span-2" />
          <Field label="বাটন টেক্সট" value={s.heroCtaText} onChange={(v) => set("heroCtaText", v)} />
          <Field label="বাটন লিংক" value={s.heroCtaUrl} onChange={(v) => set("heroCtaUrl", v)} />
        </CardContent>
      </Card>

      {/* Hero visual fallback card (shown when no hero image is set) */}
      <Card>
        <CardHeader>
          <CardTitle>হিরোর পাশের কার্ড</CardTitle>
          <p className="text-sm text-muted-foreground">হিরো ছবি না দিলে ডানপাশে এই কার্ডটি দেখাবে।</p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="শিরোনাম (১ম লাইন)" value={s["home.heroCardTitle"]} onChange={(v) => set("home.heroCardTitle", v)} />
          <Field label="শিরোনাম (২য় লাইন — সবুজ)" value={s["home.heroCardAccent"]} onChange={(v) => set("home.heroCardAccent", v)} />
          <Field label="ছোট বর্ণনা" value={s["home.heroCardSubtitle"]} onChange={(v) => set("home.heroCardSubtitle", v)} className="sm:col-span-2" />
          <Field label="বাটন টেক্সট" value={s["home.heroCardCtaText"]} onChange={(v) => set("home.heroCardCtaText", v)} />
          <Field label="বাটন লিংক" value={s["home.heroCardCtaUrl"]} onChange={(v) => set("home.heroCardCtaUrl", v)} />
        </CardContent>
      </Card>

      {/* Section headings across the home page */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Type className="size-5 text-primary" /> সেকশনের শিরোনাম ও লেখা</CardTitle>
          <p className="text-sm text-muted-foreground">হোমপেজের প্রতিটি সেকশনের শিরোনাম, বর্ণনা ও বাটনের লেখা।</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <p className="text-sm font-semibold sm:col-span-2">কোর্স ক্যাটাগরি সেকশন</p>
            <Field label="ছোট লেবেল (eyebrow)" value={s["home.coursesEyebrow"]} onChange={(v) => set("home.coursesEyebrow", v)} />
            <Field label="শিরোনাম" value={s["home.coursesTitle"]} onChange={(v) => set("home.coursesTitle", v)} />
            <TextareaField label="বর্ণনা" value={s["home.coursesSubtitle"]} onChange={(v) => set("home.coursesSubtitle", v)} className="sm:col-span-2" />
            <Field label="“সব কোর্স” বাটন" value={s["home.coursesAllText"]} onChange={(v) => set("home.coursesAllText", v)} />
            <Field label="কার্ডের বাটন" value={s["home.coursesCardCtaText"]} onChange={(v) => set("home.coursesCardCtaText", v)} />
          </div>

          <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
            <p className="text-sm font-semibold sm:col-span-2">ভিডিও স্লাইডার</p>
            <Field label="ছোট লেবেল" value={s["home.videoEyebrow"]} onChange={(v) => set("home.videoEyebrow", v)} />
            <Field label="শিরোনাম" value={s["home.videoTitle"]} onChange={(v) => set("home.videoTitle", v)} />
          </div>

          <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
            <p className="text-sm font-semibold sm:col-span-2">রিভিউ সেকশন</p>
            <Field label="ছোট লেবেল" value={s["home.reviewsEyebrow"]} onChange={(v) => set("home.reviewsEyebrow", v)} />
            <Field label="শিরোনাম" value={s["home.reviewsTitle"]} onChange={(v) => set("home.reviewsTitle", v)} />
          </div>

          <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
            <p className="text-sm font-semibold sm:col-span-2">ব্লগ সেকশন</p>
            <Field label="ছোট লেবেল" value={s["home.blogEyebrow"]} onChange={(v) => set("home.blogEyebrow", v)} />
            <Field label="শিরোনাম" value={s["home.blogTitle"]} onChange={(v) => set("home.blogTitle", v)} />
            <Field label="“সব দেখুন” বাটন" value={s["home.blogAllText"]} onChange={(v) => set("home.blogAllText", v)} />
            <Field label="“পড়ুন” লিংকের লেখা" value={s["home.blogReadText"]} onChange={(v) => set("home.blogReadText", v)} />
          </div>

          <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
            <p className="text-sm font-semibold sm:col-span-2">নিউজলেটার</p>
            <Field label="শিরোনাম" value={s["home.newsletterTitle"]} onChange={(v) => set("home.newsletterTitle", v)} />
            <Field label="বর্ণনা" value={s["home.newsletterSubtitle"]} onChange={(v) => set("home.newsletterSubtitle", v)} />
            <Field label="ইমেইল বক্সের প্লেসহোল্ডার" value={s["home.newsletterPlaceholder"]} onChange={(v) => set("home.newsletterPlaceholder", v)} />
            <Field label="বাটনের লেখা" value={s["home.newsletterButton"]} onChange={(v) => set("home.newsletterButton", v)} />
          </div>
        </CardContent>
      </Card>

      {/* Feature cards */}
      <ListEditor
        icon={Sparkles}
        title="ফিচার কার্ড"
        hint="কোর্স কার্ডের নিচের তিনটি (বা যত খুশি) ফিচার কার্ড।"
        items={s["home.features"] ?? []}
        onChange={(v) => set("home.features", v)}
        blank={() => ({ id: uid(), icon: "list", title: "", body: "", cta: "", href: "" })}
        render={(it, upd) => (
          <>
            <Field label="শিরোনাম" value={it.title} onChange={(v) => upd({ ...it, title: v })} />
            <div className="space-y-1.5">
              <Label className="text-xs">আইকন</Label>
              <Select value={it.icon} onValueChange={(v) => upd({ ...it, icon: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[["list","তালিকা"],["clipboard","পরীক্ষা"],["play","ভিডিও"],["book","বই"],["trophy","ট্রফি"],["users","শিক্ষার্থী"],["file","ফাইল"]].map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <TextareaField label="বর্ণনা" value={it.body} onChange={(v) => upd({ ...it, body: v })} className="sm:col-span-2" />
            <Field label="বাটন টেক্সট" value={it.cta} onChange={(v) => upd({ ...it, cta: v })} />
            <Field label="বাটন লিংক" value={it.href} onChange={(v) => upd({ ...it, href: v })} />
          </>
        )}
      />

      {/* Discount / promo banners */}
      <ListEditor
        icon={Tag}
        title="ডিসকাউন্ট ব্যানার"
        hint="কোর্সের অফার/ছাড় দেখানোর ইমেজ ব্যানার — হোমপেজে পরিসংখ্যানের নিচে দেখাবে। একাধিক দিলে স্বয়ংক্রিয়ভাবে ঘুরবে।"
        items={s["home.promos"] ?? []}
        onChange={(v) => set("home.promos", v)}
        blank={() => ({ id: uid(), imageUrl: "", mobileImageUrl: "", title: "", subtitle: "", discountText: "", ctaText: "কোর্স দেখুন", ctaUrl: "/courses", active: true })}
        render={(it, upd) => (
          <>
            <ImageField label="ব্যানার ছবি (ডেস্কটপ · ~1600×540)" value={it.imageUrl} onChange={(v) => upd({ ...it, imageUrl: v })} className="sm:col-span-2" />
            <ImageField label="মোবাইল ছবি (ঐচ্ছিক · ~800×600)" value={it.mobileImageUrl} onChange={(v) => upd({ ...it, mobileImageUrl: v })} className="sm:col-span-2" />
            <Field label="ছাড়ের লেখা (যেমন ৪০% ছাড়)" value={it.discountText} onChange={(v) => upd({ ...it, discountText: v })} />
            <Field label="শিরোনাম" value={it.title} onChange={(v) => upd({ ...it, title: v })} />
            <TextareaField label="বিবরণ" value={it.subtitle} onChange={(v) => upd({ ...it, subtitle: v })} className="sm:col-span-2" />
            <Field label="বাটন টেক্সট" value={it.ctaText} onChange={(v) => upd({ ...it, ctaText: v })} />
            <Field label="লিংক (কোর্সের ঠিকানা)" value={it.ctaUrl} onChange={(v) => upd({ ...it, ctaUrl: v })} />
            <label className="flex items-center gap-2 pt-6 text-sm">
              <input type="checkbox" checked={it.active !== false} onChange={(e) => upd({ ...it, active: e.target.checked })} className="size-4 accent-[var(--primary)]" /> সক্রিয়
            </label>
          </>
        )}
      />

      {/* Hero feature chips */}
      <ListEditor
        icon={Sparkles}
        title="হিরো ফিচার চিপস"
        hint="হিরোর নিচে ছোট ছোট সুবিধার তালিকা।"
        items={s["home.chips"] ?? []}
        onChange={(v) => set("home.chips", v)}
        blank={() => ({ id: uid(), label: "" })}
        render={(it, upd) => (
          <Field label="লেখা" value={it.label} onChange={(v) => upd({ ...it, label: v })} className="sm:col-span-2" />
        )}
      />

      {/* Stats */}
      <ListEditor
        icon={BarChart3}
        title="পরিসংখ্যান"
        hint="হিরোর নিচের সংখ্যার সারি।"
        items={s["home.stats"] ?? []}
        onChange={(v) => set("home.stats", v)}
        blank={() => ({ id: uid(), icon: "users", value: "", label: "" })}
        render={(it, upd) => (
          <>
            <Field label="সংখ্যা (যেমন 50,000+)" value={it.value} onChange={(v) => upd({ ...it, value: v })} />
            <Field label="লেবেল" value={it.label} onChange={(v) => upd({ ...it, label: v })} />
            <div className="space-y-1.5">
              <Label className="text-xs">আইকন</Label>
              <Select value={it.icon} onValueChange={(v) => upd({ ...it, icon: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[["users","শিক্ষার্থী"],["play","ভিডিও"],["file","MCQ"],["trophy","টেস্ট"],["star","রেটিং"]].map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      />

      {/* Course category cards are generated from the real categories now */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-start gap-3">
            <GraduationCap className="mt-0.5 size-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">কোর্স কার্ড</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                হোমপেজের কোর্স কার্ড এখন ক্যাটাগরি থেকে স্বয়ংক্রিয়ভাবে তৈরি হয় — প্রতিটি কার্ডে ক্লিক করলে ওই ক্যাটাগরির সব কোর্স দেখা যায়।
                কার্ডের নাম, রঙ, ছবি ও পয়েন্ট পরিবর্তন করতে “বিষয় ও টপিক” পেজে ক্যাটাগরি সম্পাদনা করুন।
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm"><Link href="/admin/taxonomy">ক্যাটাগরি সম্পাদনা</Link></Button>
        </CardContent>
      </Card>

      {/* Blog cards */}
      <ListEditor
        icon={Newspaper}
        title="আর্টিকেল / ব্লগ কার্ড"
        hint="খালি রাখলে হোমপেজে ব্লগ সেকশন দেখাবে না।"
        items={s["home.blog"] ?? []}
        onChange={(v) => set("home.blog", v)}
        blank={() => ({ id: uid(), title: "", imageUrl: "", date: "", url: "" })}
        render={(it, upd) => (
          <>
            <Field label="শিরোনাম" value={it.title} onChange={(v) => upd({ ...it, title: v })} className="sm:col-span-2" />
            <Field label="তারিখ" value={it.date} onChange={(v) => upd({ ...it, date: v })} />
            <Field label="লিংক" value={it.url} onChange={(v) => upd({ ...it, url: v })} />
            <ImageField label="ছবি" value={it.imageUrl} onChange={(v) => upd({ ...it, imageUrl: v })} className="sm:col-span-2" />
          </>
        )}
      />

      {/* Contact + social */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Phone className="size-5 text-primary" /> যোগাযোগ ও সোশ্যাল</CardTitle>
          <p className="text-sm text-muted-foreground">ফুটারে দেখাবে। সোশ্যাল লিংক খালি রাখলে আইকন দেখাবে না।</p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="ইমেইল" value={s["contact.email"]} onChange={(v) => set("contact.email", v)} />
          <Field label="ফোন" value={s["contact.phone"]} onChange={(v) => set("contact.phone", v)} />
          <Field label="ঠিকানা" value={s["contact.address"]} onChange={(v) => set("contact.address", v)} className="sm:col-span-2" />
          <Field label="Facebook URL" value={s["social.facebook"]} onChange={(v) => set("social.facebook", v)} />
          <Field label="Instagram URL" value={s["social.instagram"]} onChange={(v) => set("social.instagram", v)} />
          <Field label="YouTube URL" value={s["social.youtube"]} onChange={(v) => set("social.youtube", v)} />
          <Field label="WhatsApp URL" value={s["social.whatsapp"]} onChange={(v) => set("social.whatsapp", v)} />
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
              <input type="checkbox" checked={it.active !== false} onChange={(e) => upd({ ...it, active: e.target.checked })} className="size-4 accent-[var(--primary)]" /> সক্রিয়
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
