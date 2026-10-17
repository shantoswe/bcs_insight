"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Wallet, Phone, Hash } from "lucide-react";
import { get, post } from "@/lib/client-api";
import { formatBDT, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const METHOD_LABEL = { BKASH: "বিকাশ", NAGAD: "নগদ", ROCKET: "রকেট", UPAY: "উপায়", OTHER: "অন্যান্য" };
const STATUS = {
  PENDING: { label: "যাচাই বাকি", variant: "warning" },
  APPROVED: { label: "অনুমোদিত", variant: "success" },
  REJECTED: { label: "বাতিল", variant: "destructive" },
};

export function PaymentsManager() {
  const [tab, setTab] = useState("PENDING");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = tab === "ALL" ? "" : `?status=${tab}`;
      setRows(await get(`/api/v1/admin/payments${q}`));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [tab]);
  useEffect(() => { load(); }, [load]);

  async function review(id, action) {
    let adminNote = null;
    if (action === "reject") {
      adminNote = window.prompt("বাতিলের কারণ (ঐচ্ছিক):") ?? "";
    }
    setBusyId(id);
    try {
      await post(`/api/v1/admin/payments/${id}`, { action, adminNote });
      toast.success(action === "approve" ? "অনুমোদিত — শিক্ষার্থী ভর্তি হয়েছেন" : "বাতিল করা হয়েছে");
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="PENDING">যাচাই বাকি</TabsTrigger>
          <TabsTrigger value="APPROVED">অনুমোদিত</TabsTrigger>
          <TabsTrigger value="REJECTED">বাতিল</TabsTrigger>
          <TabsTrigger value="ALL">সব</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="size-7 animate-spin text-primary" /></div>
      ) : rows.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">কোনো পেমেন্ট অনুরোধ নেই।</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const st = STATUS[r.status];
            return (
              <Card key={r.id}>
                <CardContent className="flex flex-wrap items-start gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{METHOD_LABEL[r.method] || r.method}</Badge>
                      <Badge variant={st.variant}>{st.label}</Badge>
                      <span className="font-semibold">{formatBDT(r.amount)}</span>
                    </div>
                    <p className="mt-1.5 font-medium">{r.user.nameBn || r.user.name} <span className="text-muted-foreground">→ {r.course.titleBn || r.course.titleEn}</span></p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Hash className="size-3" /> শেষ ৪: <b className="font-mono text-foreground">{r.trxLast4}</b></span>
                      {r.senderNumber && <span className="flex items-center gap-1"><Phone className="size-3" /> {r.senderNumber}</span>}
                      <span>{r.user.email}{r.user.phone ? ` · ${r.user.phone}` : ""}</span>
                      <span>{formatDateTime(r.createdAt)}</span>
                    </div>
                    {r.adminNote && <p className="mt-1 text-xs text-muted-foreground">নোট: {r.adminNote}</p>}
                  </div>

                  {r.status === "PENDING" && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="accent" onClick={() => review(r.id, "approve")} disabled={busyId === r.id}>
                        {busyId === r.id ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} অনুমোদন
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => review(r.id, "reject")} disabled={busyId === r.id}>
                        <XCircle className="size-4" /> বাতিল
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
