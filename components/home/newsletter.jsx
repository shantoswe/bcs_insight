"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { post } from "@/lib/client-api";

export function Newsletter({ copy }) {
  const c = copy ?? {};
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!email.trim()) return toast.error("ইমেইল দিন");
    setBusy(true);
    try {
      await post("/api/v1/newsletter", { email: email.trim() });
      toast.success("সাবস্ক্রাইব সম্পন্ন — ধন্যবাদ!");
      setEmail("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 pb-14 md:pb-16">
      <div className="flex flex-col gap-5 rounded-xl bg-navy px-6 py-7 text-navy-foreground md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <h2 className="text-lg font-bold md:text-xl">{c.title || "আপডেট থাকতে সাবস্ক্রাইব করুন"}</h2>
          {c.subtitle !== "" && (
            <p className="mt-1 text-sm text-white/70">
              {c.subtitle || "নতুন কোর্স, ফ্রি ক্লাস ও পরীক্ষার আপডেট পেতে আমাদের সাথে থাকুন"}
            </p>
          )}
        </div>
        <form onSubmit={submit} className="flex w-full max-w-md gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={c.placeholder || "আপনার ইমেইল লিখুন"}
            aria-label="ইমেইল"
            className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/10 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/50 focus:border-white/40"
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} {c.button || "সাবস্ক্রাইব"}
          </button>
        </form>
      </div>
    </section>
  );
}
