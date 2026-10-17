"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Plus, Settings2, Trash2, FileText, Users } from "lucide-react";
import { get, post, del } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";

const STATUS = { DRAFT: "খসড়া", PUBLISHED: "প্রকাশিত", COMPLETED: "সম্পন্ন" };

export function WrittenManager() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ titleBn: "", titleEn: "", descriptionBn: "", durationMinutes: 60, uploadWindowMinutes: 10 });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try { setExams(await get("/api/v1/admin/written")); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!f.titleBn && !f.titleEn) return toast.error("শিরোনাম দিন");
    setSaving(true);
    try {
      await post("/api/v1/admin/written", {
        titleEn: f.titleEn || f.titleBn,
        titleBn: f.titleBn || null,
        descriptionBn: f.descriptionBn || null,
        durationMinutes: Number(f.durationMinutes),
        uploadWindowMinutes: Number(f.uploadWindowMinutes),
      });
      toast.success("তৈরি হয়েছে");
      setOpen(false);
      setF({ titleBn: "", titleEn: "", descriptionBn: "", durationMinutes: 60, uploadWindowMinutes: 10 });
      load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function remove(id) {
    if (!confirm("মুছে ফেলবেন?")) return;
    try { await del(`/api/v1/admin/written/${id}`); load(); } catch (e) { toast.error(e.message); }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4" /> নতুন লিখিত পরীক্ষা</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>নতুন লিখিত পরীক্ষা</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>শিরোনাম (বাংলা)</Label><Input value={f.titleBn} onChange={(e) => setF({ ...f, titleBn: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>শিরোনাম (English)</Label><Input value={f.titleEn} onChange={(e) => setF({ ...f, titleEn: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>বিবরণ</Label><Textarea value={f.descriptionBn} onChange={(e) => setF({ ...f, descriptionBn: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>পরীক্ষার সময় (মিনিট)</Label><Input type="number" value={f.durationMinutes} onChange={(e) => setF({ ...f, durationMinutes: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>আপলোড উইন্ডো (মিনিট)</Label><Input type="number" value={f.uploadWindowMinutes} onChange={(e) => setF({ ...f, uploadWindowMinutes: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter><Button onClick={create} disabled={saving}>{saving && <Loader2 className="size-4 animate-spin" />} তৈরি করুন</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="size-7 animate-spin text-primary" /></div>
      ) : exams.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">কোনো লিখিত পরীক্ষা নেই।</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {exams.map((e) => (
            <Card key={e.id}>
              <CardContent className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="accent">লিখিত</Badge>
                    <Badge variant={e.status === "PUBLISHED" ? "success" : "outline"}>{STATUS[e.status] ?? e.status}</Badge>
                  </div>
                  <p className="mt-1.5 font-medium">{e.titleBn || e.titleEn}</p>
                  <p className="text-xs text-muted-foreground">
                    <FileText className="mr-1 inline size-3" />{e._count.questions} প্রশ্ন ·
                    <Users className="mx-1 inline size-3" />{e._count.attempts} জমা · {e.durationMinutes} মিনিট
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button asChild variant="outline" size="sm"><Link href={`/admin/written/${e.id}`}><Settings2 className="size-4" /> সম্পাদনা</Link></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(e.id)}><Trash2 className="size-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
