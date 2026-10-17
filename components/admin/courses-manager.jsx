"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Plus, Settings2, Pencil, Trash2, Layers, Users, Eye, EyeOff, PlayCircle } from "lucide-react";
import { get, patch, del } from "@/lib/client-api";
import { formatBDT } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { CourseForm } from "@/components/admin/course-form";

const TYPE_LABEL = { PRELIMINARY: "প্রিলিমিনারি", WRITTEN: "লিখিত", EXAM: "পরীক্ষা", GENERAL: "সাধারণ" };

export function CoursesManager() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null); // null | "new" | course object (edit)

  async function load() {
    setLoading(true);
    try { setCourses(await get("/api/v1/admin/courses")); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function togglePublish(c) {
    try { await patch(`/api/v1/admin/courses/${c.id}`, { isPublished: !c.isPublished }); load(); }
    catch (e) { toast.error(e.message); }
  }
  async function remove(id) {
    if (!confirm("কোর্সটি মুছে ফেলবেন?")) return;
    try { await del(`/api/v1/admin/courses/${id}`); load(); } catch (e) { toast.error(e.message); }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialog === "new"} onOpenChange={(o) => setDialog(o ? "new" : null)}>
          <DialogTrigger asChild><Button><Plus className="size-4" /> নতুন কোর্স</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>নতুন কোর্স</DialogTitle></DialogHeader>
            <CourseForm onSaved={() => { setDialog(null); load(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="size-7 animate-spin text-primary" /></div>
      ) : courses.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">কোনো কোর্স নেই।</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {courses.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex flex-wrap items-center gap-3 p-4">
                <div className="flex aspect-video w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg brand-gradient">
                  {c.thumbnailUrl || c.thumbnailPath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.thumbnailUrl || c.thumbnailPath} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <PlayCircle className="size-6 text-white/80" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{TYPE_LABEL[c.courseType] || "সাধারণ"}</Badge>
                    <Badge variant={c.isPublished ? "success" : "outline"}>{c.isPublished ? "প্রকাশিত" : "খসড়া"}</Badge>
                    {c.isFree || Number(c.priceBDT) === 0 ? <Badge variant="secondary">ফ্রি</Badge> : <span className="text-sm font-semibold text-primary">{formatBDT(c.priceBDT)}</span>}
                  </div>
                  <p className="mt-1.5 font-medium">{c.titleBn || c.titleEn}</p>
                  <p className="text-xs text-muted-foreground">
                    <Layers className="mr-1 inline size-3" />{c._count.sections} সেকশন · <Users className="mx-1 inline size-3" />{c._count.enrollments} শিক্ষার্থী
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button asChild variant="outline" size="sm"><Link href={`/admin/courses/${c.id}`}><Settings2 className="size-4" /> সেকশন/লেসন</Link></Button>
                  <Dialog open={dialog?.id === c.id} onOpenChange={(o) => setDialog(o ? c : null)}>
                    <DialogTrigger asChild><Button variant="ghost" size="sm"><Pencil className="size-4" /> এডিট</Button></DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader><DialogTitle>কোর্স এডিট</DialogTitle></DialogHeader>
                      <CourseForm initial={c} onSaved={() => { setDialog(null); load(); }} />
                    </DialogContent>
                  </Dialog>
                  {c.isPublished ? (
                    <Button variant="ghost" size="sm" onClick={() => togglePublish(c)}><EyeOff className="size-4" /> লুকান</Button>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => togglePublish(c)}><Eye className="size-4" /> প্রকাশ</Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="size-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
