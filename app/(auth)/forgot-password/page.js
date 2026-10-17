"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
  }

  if (sent) {
    return (
      <Card className="soft-shadow text-center">
        <CardContent className="pt-8">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent/15 text-accent-foreground">
            <MailCheck className="size-7" />
          </span>
          <h2 className="mt-4 text-xl font-bold">লিংক পাঠানো হয়েছে</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            পাসওয়ার্ড রিসেট করার লিংক আপনার ইমেইলে পাঠানো হয়েছে।
          </p>
          <Button asChild variant="outline" className="mt-6"><Link href="/login">লগইনে ফিরুন</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="soft-shadow">
      <CardHeader>
        <CardTitle className="text-2xl">পাসওয়ার্ড রিসেট</CardTitle>
        <CardDescription>ইমেইল দিন — রিসেট লিংক পাঠানো হবে।</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">ইমেইল</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />} রিসেট লিংক পাঠান
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">লগইনে ফিরুন</Link>
        </p>
      </CardContent>
    </Card>
  );
}
