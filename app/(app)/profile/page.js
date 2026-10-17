"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, User, Mail, Camera } from "lucide-react";
import { get, patch, post } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", nameBn: "", phone: "", targetExam: "" });
  const photoRef = useRef(null);

  async function onPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { photoUrl } = await post("/api/v1/profile/photo", fd);
      setProfile((p) => ({ ...p, photoUrl }));
      toast.success("ছবি হালনাগাদ হয়েছে");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    get("/api/v1/profile")
      .then((p) => {
        setProfile(p);
        setForm({
          name: p.name ?? "",
          nameBn: p.nameBn ?? "",
          phone: p.phone ?? "",
          targetExam: p.targetExam ?? "",
        });
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await patch("/api/v1/profile", form);
      toast.success("প্রোফাইল সংরক্ষিত হয়েছে");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return <div className="flex justify-center py-20"><Loader2 className="size-7 animate-spin text-primary" /></div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">প্রোফাইল</h1>

      <Card className="mb-4">
        <CardContent className="flex items-center gap-4 p-5">
          <button
            type="button"
            onClick={() => photoRef.current?.click()}
            className="group relative flex size-14 items-center justify-center overflow-hidden rounded-2xl brand-gradient text-white"
            title="ছবি পরিবর্তন করুন"
          >
            {profile?.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.photoUrl} alt="" className="size-full object-cover" />
            ) : (
              <User className="size-7" />
            )}
            <span className="absolute inset-0 hidden items-center justify-center bg-black/40 group-hover:flex">
              {uploading ? <Loader2 className="size-5 animate-spin" /> : <Camera className="size-5" />}
            </span>
          </button>
          <input ref={photoRef} type="file" accept="image/*" hidden onChange={onPhoto} />
          <div>
            <p className="font-semibold">{profile?.name}</p>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <Mail className="size-3.5" /> {profile?.email}
            </p>
          </div>
          <Badge className="ml-auto" variant={profile?.role === "STUDENT" ? "default" : "secondary"}>
            {profile?.role}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>তথ্য সম্পাদনা</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>নাম (English)</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>নাম (বাংলা)</Label>
                <Input value={form.nameBn} onChange={(e) => setForm({ ...form, nameBn: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>মোবাইল</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" />
              </div>
              <div className="space-y-2">
                <Label>লক্ষ্য পরীক্ষা</Label>
                <Input value={form.targetExam} onChange={(e) => setForm({ ...form, targetExam: e.target.value })} placeholder="47th BCS" />
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />} সংরক্ষণ করুন
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
