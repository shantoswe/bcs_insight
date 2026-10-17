"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/track";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sentEmail, setSentEmail] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });

  async function onSubmit(e) {
    e.preventDefault();
    if (form.password.length < 8) return toast.error("পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে");
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: { name: form.name.trim(), phone: form.phone.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Conversion: browser Pixel/gtag event + deduplicated server (CAPI/MP) copy.
    trackEvent("CompleteRegistration", { method: "email", content_name: "signup" }, { email: form.email.trim(), phone: form.phone.trim() });

    // If email confirmation is on, there is no active session yet.
    if (!data.session) {
      setSentEmail(form.email.trim());
      setLoading(false);
      return;
    }

    toast.success("অ্যাকাউন্ট তৈরি হয়েছে!");
    router.push("/dashboard");
    router.refresh();
  }

  if (sentEmail) {
    return (
      <Card className="soft-shadow text-center">
        <CardContent className="pt-8">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent/15 text-accent-foreground">
            <MailCheck className="size-7" />
          </span>
          <h2 className="mt-4 text-xl font-bold">ইমেইল যাচাই করুন</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{sentEmail}</span> এ একটি নিশ্চিতকরণ লিংক পাঠানো হয়েছে। লিংকে ক্লিক করে অ্যাকাউন্ট চালু করুন।
          </p>
          <Button asChild variant="outline" className="mt-6"><Link href="/login">লগইনে ফিরুন</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="soft-shadow">
      <CardHeader>
        <CardTitle className="text-2xl">রেজিস্টার করুন</CardTitle>
        <CardDescription>ফ্রি অ্যাকাউন্ট খুলে প্রস্তুতি শুরু করুন।</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">পূর্ণ নাম</Label>
            <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="আপনার নাম" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">ইমেইল</Label>
            <Input id="email" type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">মোবাইল <span className="text-muted-foreground">(ঐচ্ছিক)</span></Label>
            <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">পাসওয়ার্ড</Label>
            <Input id="password" type="password" required autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="কমপক্ষে ৮ অক্ষর" />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />} অ্যাকাউন্ট তৈরি করুন
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">লগইন করুন</Link>
        </p>
      </CardContent>
    </Card>
  );
}
