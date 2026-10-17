"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ClipboardCheck } from "lucide-react";
import { get } from "@/lib/client-api";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EvaluatePanel } from "@/components/admin/evaluate-panel";

export function WrittenSubmissions({ writtenExamId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null); // attemptId

  async function load() {
    setLoading(true);
    try { setRows(await get(`/api/v1/admin/written/${writtenExamId}/submissions`)); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [writtenExamId]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  if (rows.length === 0) return <Card><CardContent className="py-12 text-center text-muted-foreground">এখনো কোনো জমা নেই।</CardContent></Card>;

  return (
    <>
      <div className="space-y-2">
        {rows.map((r) => (
          <Card key={r.id}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{r.user.nameBn || r.user.name}</p>
                <p className="text-xs text-muted-foreground">{r.user.email} · জমা {formatDateTime(r.submittedAt)}</p>
              </div>
              <Badge variant={r.status === "EVALUATED" ? "success" : "warning"}>
                {r.status === "EVALUATED" ? `${Number(r.totalAwarded ?? 0)} নম্বর` : "মূল্যায়ন বাকি"}
              </Badge>
              <Button size="sm" variant="outline" onClick={() => setActive(r.id)}>
                <ClipboardCheck className="size-4" /> মূল্যায়ন
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      {active && <EvaluatePanel attemptId={active} onClose={() => setActive(null)} onSaved={() => { setActive(null); load(); }} />}
    </>
  );
}
