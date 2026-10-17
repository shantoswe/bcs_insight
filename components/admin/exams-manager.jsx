"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Loader2, Plus, Pencil, Trash2, Settings2, Radio, FileText, Send, Undo2, Trophy,
} from "lucide-react";
import { get, post, del } from "@/lib/client-api";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { ExamForm } from "@/components/admin/exam-form";

const STATUS = {
  DRAFT: { label: "খসড়া", variant: "outline" },
  PUBLISHED: { label: "প্রকাশিত", variant: "success" },
  ONGOING: { label: "চলমান", variant: "secondary" },
  COMPLETED: { label: "সম্পন্ন", variant: "default" },
  ARCHIVED: { label: "আর্কাইভ", variant: "outline" },
};

export function ExamsManager() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    try {
      setExams(await get("/api/v1/admin/exams"));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function action(id, act) {
    try {
      await post(`/api/v1/admin/exams/${id}/publish`, { action: act });
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }
  async function remove(id) {
    if (!confirm("পরীক্ষাটি মুছে ফেলবেন?")) return;
    try { await del(`/api/v1/admin/exams/${id}`); load(); toast.success("মুছে ফেলা হয়েছে"); }
    catch (e) { toast.error(e.message); }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button><Plus className="size-4" /> নতুন পরীক্ষা</Button></DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>{editing ? "পরীক্ষা সম্পাদনা" : "নতুন পরীক্ষা"}</DialogTitle></DialogHeader>
            <ExamForm initial={editing} onSaved={() => { setCreateOpen(false); setEditing(null); load(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="size-7 animate-spin text-primary" /></div>
      ) : exams.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">কোনো পরীক্ষা নেই।</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {exams.map((e) => {
            const st = STATUS[e.status] ?? STATUS.DRAFT;
            return (
              <Card key={e.id}>
                <CardContent className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={e.type === "LIVE" ? "secondary" : "default"}>
                        {e.type === "LIVE" ? <><Radio className="mr-1 size-3" />লাইভ</> : "প্র্যাকটিস"}
                      </Badge>
                      <Badge variant={st.variant}>{st.label}</Badge>
                      {e.category && <Badge variant="outline">{e.category.nameBn}</Badge>}
                    </div>
                    <p className="mt-1.5 font-medium">{e.titleBn || e.titleEn}</p>
                    <p className="text-xs text-muted-foreground">
                      <FileText className="mr-1 inline size-3" />{e._count.questions} প্রশ্ন · {e.durationMinutes} মিনিট · {e._count.attempts} অংশগ্রহণ
                      {e.startAt && ` · শুরু ${formatDateTime(e.startAt)}`}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <Button asChild variant="outline" size="sm"><Link href={`/admin/exams/${e.id}`}><Settings2 className="size-4" /> প্রশ্ন</Link></Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(e); setCreateOpen(true); }}><Pencil className="size-4" /></Button>
                    {e.status === "DRAFT" ? (
                      <Button size="sm" onClick={() => action(e.id, "publish")}><Send className="size-4" /> প্রকাশ</Button>
                    ) : e.status === "PUBLISHED" ? (
                      <Button variant="outline" size="sm" onClick={() => action(e.id, "unpublish")}><Undo2 className="size-4" /> খসড়া</Button>
                    ) : null}
                    {e.type === "LIVE" && (e.status === "ONGOING" || e.status === "COMPLETED") && (
                      <Button variant="secondary" size="sm" onClick={() => action(e.id, "publish-results")}><Trophy className="size-4" /> ফল প্রকাশ</Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => remove(e.id)}><Trash2 className="size-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
