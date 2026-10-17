"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Wallet, Clock, Copy, CheckCircle2, XCircle } from "lucide-react";
import { post } from "@/lib/client-api";
import { formatBDT } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

const METHOD_LABEL = { BKASH: "বিকাশ", NAGAD: "নগদ", ROCKET: "রকেট", UPAY: "উপায়", OTHER: "অন্যান্য" };

export function EnrollPaid({ course, payment, paymentConfig }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (payment?.status === "PENDING") {
    return (
      <div className="rounded-xl border border-secondary/30 bg-secondary/8 p-3 text-center text-sm">
        <Clock className="mx-auto mb-1 size-5 text-secondary" />
        <p className="font-medium text-secondary">পেমেন্ট যাচাই চলছে</p>
        <p className="text-xs text-muted-foreground">অ্যাডমিন অনুমোদন করলেই কোর্স চালু হবে।</p>
      </div>
    );
  }

  return (
    <>
      {payment?.status === "REJECTED" && (
        <div className="mb-2 rounded-lg bg-destructive/8 p-2 text-xs text-destructive">
          <XCircle className="mr-1 inline size-3.5" /> আগের পেমেন্ট যাচাই হয়নি{payment.adminNote ? `: ${payment.adminNote}` : ""}। আবার চেষ্টা করুন।
        </div>
      )}
      <Button className="w-full" onClick={() => setOpen(true)}>
        <Wallet className="size-4" /> {formatBDT(course.priceBDT)} — ভর্তি হন
      </Button>
      {open && (
        <PaymentForm
          course={course}
          paymentConfig={paymentConfig}
          onClose={() => setOpen(false)}
          onDone={() => { setOpen(false); router.refresh(); }}
        />
      )}
    </>
  );
}

function PaymentForm({ course, paymentConfig, onClose, onDone }) {
  const methods = (paymentConfig?.methods ?? []).filter((m) => m.active !== false);
  const [f, setF] = useState({ method: methods[0]?.method || "BKASH", senderNumber: "", trxLast4: "", amount: Number(course.priceBDT) || 0 });
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!f.trxLast4.trim()) return toast.error("ট্রানজেকশনের শেষ ৪ সংখ্যা দিন");
    setSaving(true);
    try {
      await post(`/api/v1/courses/${course.id}/payment`, {
        method: f.method,
        senderNumber: f.senderNumber || null,
        trxLast4: f.trxLast4.trim(),
        amount: Number(f.amount) || 0,
      });
      toast.success("পেমেন্ট জমা হয়েছে — অ্যাডমিন অনুমোদন করবেন");
      onDone();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>পেমেন্ট — {course.titleBn || course.titleEn}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="rounded-lg bg-muted p-3 text-sm">{paymentConfig?.instructions}</p>

          {/* receiving numbers */}
          {methods.length > 0 ? (
            <div className="space-y-2">
              <Label className="text-xs">নিচের যেকোনো নম্বরে পাঠান ({formatBDT(course.priceBDT)})</Label>
              {methods.map((m) => (
                <Card key={m.id}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <Badge>{METHOD_LABEL[m.method] || m.method}</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono font-semibold">{m.number}</p>
                      {(m.label || m.accountType) && <p className="text-xs text-muted-foreground">{m.label || m.accountType}</p>}
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(m.number); toast.success("নম্বর কপি হয়েছে"); }} className="text-muted-foreground hover:text-primary"><Copy className="size-4" /></button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-secondary/10 p-3 text-sm text-secondary">পেমেন্ট নম্বর এখনো সেট করা হয়নি — অ্যাডমিনের সাথে যোগাযোগ করুন।</p>
          )}

          {/* submission form */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">মাধ্যম</Label>
              <Select value={f.method} onValueChange={(v) => setF({ ...f, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["BKASH", "NAGAD", "ROCKET", "UPAY", "OTHER"].map((m) => <SelectItem key={m} value={m}>{METHOD_LABEL[m]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">যে নম্বর থেকে পাঠিয়েছেন</Label>
              <Input value={f.senderNumber} onChange={(e) => setF({ ...f, senderNumber: e.target.value })} placeholder="01XXXXXXXXX" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">ট্রানজেকশন আইডির শেষ ৪ সংখ্যা *</Label>
              <Input value={f.trxLast4} onChange={(e) => setF({ ...f, trxLast4: e.target.value })} placeholder="যেমন: 7X2A" maxLength={10} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">পরিমাণ (৳)</Label>
              <Input type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} পেমেন্ট জমা দিন
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
