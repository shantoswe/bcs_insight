"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Megaphone, Send } from "lucide-react";
import { get, patch, post } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FIELDS = [
  ["siteName", "সাইটের নাম", "input"],
  ["tagline", "ট্যাগলাইন", "input"],
  ["heroTitle", "হিরো শিরোনাম", "input"],
  ["heroSubtitle", "হিরো সাবটাইটেল", "textarea"],
];

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    get("/api/v1/admin/settings")
      .then((s) => setForm(s))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const patchBody = Object.fromEntries(FIELDS.map(([k]) => [k, form[k] ?? ""]));
      await patch("/api/v1/admin/settings", patchBody);
      toast.success("সংরক্ষিত হয়েছে");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return <div className="flex justify-center py-20"><Loader2 className="size-7 animate-spin text-primary" /></div>;

  return (
    <div className="p-5 lg:p-8">
      <h1 className="text-2xl font-bold">সাইট সেটিংস</h1>
      <p className="mb-6 text-muted-foreground">হোম পেজের টেক্সট ও ব্র্যান্ডিং পরিবর্তন করুন।</p>

      <Card className="max-w-2xl">
        <CardHeader><CardTitle>সাধারণ</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {FIELDS.map(([key, label, kind]) => (
            <div key={key} className="space-y-1.5">
              <Label>{label}</Label>
              {kind === "textarea" ? (
                <Textarea value={form[key] ?? ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              ) : (
                <Input value={form[key] ?? ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              )}
            </div>
          ))}
          <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} সংরক্ষণ</Button>
        </CardContent>
      </Card>

      <AnnouncementComposer />
    </div>
  );
}

function AnnouncementComposer() {
  const [f, setF] = useState({ title: "", body: "", link: "" });
  const [sending, setSending] = useState(false);

  async function send() {
    if (!f.title.trim()) return toast.error("শিরোনাম দিন");
    setSending(true);
    try {
      const { sent } = await post("/api/v1/admin/notifications", {
        title: f.title.trim(),
        body: f.body.trim() || null,
        link: f.link.trim() || null,
      });
      toast.success(`${sent} জন শিক্ষার্থীকে পাঠানো হয়েছে`);
      setF({ title: "", body: "", link: "" });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="mt-6 max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Megaphone className="size-5 text-secondary" /> ঘোষণা পাঠান</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">সকল শিক্ষার্থীর নোটিফিকেশনে একটি বার্তা পাঠান।</p>
        <div className="space-y-1.5"><Label>শিরোনাম</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="নতুন লাইভ পরীক্ষা আসছে!" /></div>
        <div className="space-y-1.5"><Label>বিবরণ</Label><Textarea value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>লিংক (ঐচ্ছিক)</Label><Input value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} placeholder="/exams" /></div>
        <Button onClick={send} disabled={sending}>{sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} সবাইকে পাঠান</Button>
      </CardContent>
    </Card>
  );
}
