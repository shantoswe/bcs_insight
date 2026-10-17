"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Loader2, Plus, ArrowLeft, Trash2, Pencil, PlayCircle, FileText, Link2, Radio, GripVertical,
} from "lucide-react";
import { get, post, patch, del } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LessonForm } from "@/components/admin/lesson-form";
import { CourseStudents } from "@/components/admin/course-students";

const ICON = { VIDEO: PlayCircle, PDF: FileText, RESOURCE: Link2, LIVE_CLASS: Radio, EXAM: FileText, QUIZ: FileText };

export function CourseBuilder({ courseId }) {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newSection, setNewSection] = useState("");
  const [lessonDialog, setLessonDialog] = useState(null); // { sectionId, lesson? }

  const load = useCallback(async () => {
    try { setCourse(await get(`/api/v1/admin/courses/${courseId}`)); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [courseId]);
  useEffect(() => { load(); }, [load]);

  async function addSection() {
    if (!newSection.trim()) return;
    try {
      await post("/api/v1/admin/sections", { courseId, titleBn: newSection, titleEn: newSection, order: course.sections.length });
      setNewSection("");
      toast.success("সেকশন যোগ হয়েছে");
      await load();
    } catch (e) { toast.error(e.message); }
  }
  async function removeSection(id) {
    if (!confirm("সেকশন ও এর সব লেসন মুছে ফেলবেন?")) return;
    try { await del(`/api/v1/admin/sections/${id}`); load(); } catch (e) { toast.error(e.message); }
  }
  async function removeLesson(id) {
    if (!confirm("লেসনটি মুছে ফেলবেন?")) return;
    try { await del(`/api/v1/admin/lessons/${id}`); load(); } catch (e) { toast.error(e.message); }
  }

  if (loading)
    return <div className="flex justify-center py-16"><Loader2 className="size-7 animate-spin text-primary" /></div>;
  if (!course) return null;

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3"><Link href="/admin/courses"><ArrowLeft className="size-4" /> কোর্স তালিকা</Link></Button>
      <h1 className="text-2xl font-bold">{course.titleBn || course.titleEn}</h1>
      <p className="mb-5 text-muted-foreground">সেকশন ও লেসন সাজান। ভিডিও সরাসরি Bunny-তে আপলোড হবে।</p>

      <Tabs defaultValue="curriculum">
        <TabsList>
          <TabsTrigger value="curriculum">কারিকুলাম</TabsTrigger>
          <TabsTrigger value="students">শিক্ষার্থী</TabsTrigger>
        </TabsList>
        <TabsContent value="students">
          <CourseStudents courseId={courseId} />
        </TabsContent>
        <TabsContent value="curriculum">

      <div className="mb-4 flex gap-2">
        <Input placeholder="নতুন সেকশনের নাম" value={newSection} onChange={(e) => setNewSection(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSection()} className="max-w-xs" />
        <Button variant="outline" onClick={addSection}><Plus className="size-4" /> সেকশন</Button>
      </div>

      {course.sections.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">প্রথমে একটি সেকশন যোগ করুন।</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {course.sections.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-semibold"><GripVertical className="size-4 text-muted-foreground" /> {s.titleBn || s.titleEn}</h3>
                  <div className="flex gap-1">
                    <Dialog open={lessonDialog?.sectionId === s.id && !lessonDialog?.lesson} onOpenChange={(o) => setLessonDialog(o ? { sectionId: s.id } : null)}>
                      <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="size-4" /> লেসন</Button></DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader><DialogTitle>নতুন লেসন</DialogTitle></DialogHeader>
                        <LessonForm sectionId={s.id} onSaved={() => { setLessonDialog(null); load(); }} />
                      </DialogContent>
                    </Dialog>
                    <button onClick={() => removeSection(s.id)} className="rounded p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                  </div>
                </div>

                {s.lessons.length === 0 ? (
                  <p className="py-3 text-center text-sm text-muted-foreground">এই সেকশনে কোনো লেসন নেই।</p>
                ) : (
                  <div className="space-y-1.5">
                    {s.lessons.map((l) => {
                      const Icon = ICON[l.type] ?? PlayCircle;
                      return (
                        <div key={l.id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                          <Icon className="size-4 text-muted-foreground" />
                          <span className="flex-1 truncate text-sm">{l.titleBn || l.titleEn}</span>
                          {l.isFreePreview && <Badge variant="success" className="text-[10px]">ফ্রি</Badge>}
                          {l.type === "VIDEO" && (
                            <Badge variant={l.videoStatus === "READY" ? "success" : l.videoStatus === "NONE" ? "outline" : "warning"} className="text-[10px]">
                              {l.videoStatus === "READY" ? "প্রস্তুত" : l.videoStatus === "NONE" ? "ভিডিও নেই" : "প্রসেসিং"}
                            </Badge>
                          )}
                          <Dialog open={lessonDialog?.lesson?.id === l.id} onOpenChange={(o) => setLessonDialog(o ? { sectionId: s.id, lesson: l } : null)}>
                            <DialogTrigger asChild><button className="text-muted-foreground hover:text-primary"><Pencil className="size-3.5" /></button></DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader><DialogTitle>লেসন সম্পাদনা</DialogTitle></DialogHeader>
                              <LessonForm sectionId={s.id} initial={l} onSaved={() => { setLessonDialog(null); load(); }} />
                            </DialogContent>
                          </Dialog>
                          <button onClick={() => removeLesson(l.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
