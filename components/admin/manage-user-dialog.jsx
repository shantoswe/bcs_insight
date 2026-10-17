"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, X, Trash2, BookOpen, ClipboardList, RotateCcw } from "lucide-react";
import { get, post, del } from "@/lib/client-api";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const TYPE_LABEL = { PRELIMINARY: "প্রিলিমিনারি", WRITTEN: "লিখিত", EXAM: "পরীক্ষা", GENERAL: "সাধারণ" };

export function ManageUserDialog({ user, onClose }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{user.name} — ম্যানেজ</DialogTitle></DialogHeader>
        <Tabs defaultValue="courses">
          <TabsList>
            <TabsTrigger value="courses"><BookOpen className="mr-1.5 size-4" /> কোর্স</TabsTrigger>
            <TabsTrigger value="attempts"><ClipboardList className="mr-1.5 size-4" /> পরীক্ষা</TabsTrigger>
          </TabsList>
          <TabsContent value="courses"><CoursesTab userId={user.id} /></TabsContent>
          <TabsContent value="attempts"><AttemptsTab userId={user.id} /></TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function CoursesTab({ userId }) {
  const [enrolled, setEnrolled] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pick, setPick] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [en, all] = await Promise.all([
        get(`/api/v1/admin/users/${userId}/courses`),
        get("/api/v1/admin/courses"),
      ]);
      setEnrolled(en);
      setAllCourses(all);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [userId]);

  const enrolledIds = new Set(enrolled.map((e) => e.courseId));
  const available = allCourses.filter((c) => !enrolledIds.has(c.id));

  async function assign() {
    if (!pick) return;
    setBusy(true);
    try {
      await post(`/api/v1/admin/users/${userId}/courses`, { courseId: pick, action: "assign" });
      setPick("");
      load();
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  }
  async function remove(courseId) {
    try {
      await post(`/api/v1/admin/users/${userId}/courses`, { courseId, action: "remove" });
      load();
    } catch (e) { toast.error(e.message); }
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium">যুক্ত কোর্স</p>
        {enrolled.length === 0 ? (
          <p className="text-sm text-muted-foreground">কোনো কোর্সে যুক্ত নেই।</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {enrolled.map((e) => (
              <span key={e.courseId} className="flex items-center gap-1.5 rounded-full border bg-primary/8 py-1 pl-3 pr-1.5 text-sm">
                <Badge variant="outline" className="text-[10px]">{TYPE_LABEL[e.courseType]}</Badge>
                {e.title}
                <button onClick={() => remove(e.courseId)} className="flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="সরান">
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">কোর্সে যুক্ত করুন</p>
        <div className="flex gap-2">
          <Select value={pick} onValueChange={setPick}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="কোর্স নির্বাচন করুন" /></SelectTrigger>
            <SelectContent>
              {available.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">যুক্ত করার মতো কোর্স নেই</div>
              ) : available.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.titleBn || c.titleEn}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={assign} disabled={busy || !pick}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} যুক্ত করুন
          </Button>
        </div>
      </div>
    </div>
  );
}

function AttemptsTab({ userId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setRows(await get(`/api/v1/admin/users/${userId}/attempts`)); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [userId]);

  async function reset(id) {
    if (!confirm("এই অ্যাটেম্পট মুছে ফেলবেন? শিক্ষার্থী আবার এই পরীক্ষায় অংশ নিতে পারবেন।")) return;
    try {
      await del(`/api/v1/admin/attempts/${id}`);
      toast.success("মুছে ফেলা হয়েছে — পুনরায় অংশ নেওয়া যাবে");
      load();
    } catch (e) { toast.error(e.message); }
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">কোনো পরীক্ষার রেকর্ড নেই।</p>;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">লাইভ পরীক্ষায় পুনরায় অংশ নিতে দিতে অ্যাটেম্পট মুছুন।</p>
      {rows.map((a) => (
        <Card key={a.id}>
          <CardContent className="flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{a.title}</p>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <Badge variant={a.examType === "LIVE" ? "secondary" : "outline"} className="text-[10px]">{a.examType === "LIVE" ? "লাইভ" : "প্র্যাকটিস"}</Badge>
                {a.isArchive && <Badge variant="outline" className="text-[10px]">আর্কাইভ</Badge>}
                <span>{a.status === "IN_PROGRESS" ? "চলমান" : `স্কোর ${a.score ?? 0}/${a.totalMarks}`}</span>
                <span>· {formatDateTime(a.startedAt)}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => reset(a.id)}>
              <RotateCcw className="size-4" /> রিসেট
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
