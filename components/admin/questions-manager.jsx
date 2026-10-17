"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Upload, Pencil, Trash2, Search } from "lucide-react";
import { get, del } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MathText } from "@/components/ui/math-text";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { QuestionForm } from "@/components/admin/question-form";
import { ImportWizard } from "@/components/admin/import-wizard";

const DIFF_LABEL = { EASY: "সহজ", MEDIUM: "মাঝারি", HARD: "কঠিন" };

export function QuestionsManager() {
  const [tree, setTree] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subjectId, setSubjectId] = useState("");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => { get("/api/v1/taxonomy").then(setTree).catch(() => {}); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (subjectId) q.set("subjectId", subjectId);
      if (search) q.set("search", search);
      q.set("limit", "50");
      const data = await get(`/api/v1/admin/questions?${q}`);
      setQuestions(data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [subjectId, search]);

  useEffect(() => { load(); }, [load]);

  const allSubjects = tree.flatMap((c) => c.subjects.map((s) => ({ id: s.id, name: `${c.nameBn} · ${s.nameBn}` })));

  async function remove(id) {
    if (!confirm("প্রশ্নটি মুছে ফেলবেন?")) return;
    try {
      await del(`/api/v1/admin/questions/${id}`);
      setQuestions((qs) => qs.filter((q) => q.id !== id));
      toast.success("মুছে ফেলা হয়েছে");
    } catch (e) {
      toast.error(e.message);
    }
  }

  function onFormSaved() { setFormOpen(false); setEditing(null); load(); }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="প্রশ্ন খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={subjectId || "all"} onValueChange={(v) => setSubjectId(v === "all" ? "" : v)}>
          <SelectTrigger className="w-52"><SelectValue placeholder="বিষয়" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব বিষয়</SelectItem>
            {allSubjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogTrigger asChild><Button variant="outline"><Upload className="size-4" /> বাল্ক আপলোড</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>বাল্ক MCQ আপলোড</DialogTitle></DialogHeader>
            <ImportWizard onDone={() => { setImportOpen(false); load(); }} />
          </DialogContent>
        </Dialog>

        <Dialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button><Plus className="size-4" /> নতুন প্রশ্ন</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editing ? "প্রশ্ন সম্পাদনা" : "নতুন প্রশ্ন"}</DialogTitle></DialogHeader>
            <QuestionForm tree={tree} initial={editing} onSaved={onFormSaved} />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="size-7 animate-spin text-primary" /></div>
      ) : questions.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">কোনো প্রশ্ন নেই। যোগ করুন বা বাল্ক আপলোড করুন।</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {questions.map((q) => (
            <Card key={q.id}>
              <CardContent className="flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <MathText as="p" className="font-medium">{q.textBn}</MathText>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Badge variant="outline">{q.subject?.nameBn}</Badge>
                    {q.topic && <Badge variant="outline">{q.topic.nameBn}</Badge>}
                    <Badge variant="secondary">{DIFF_LABEL[q.difficulty]}</Badge>
                    <Badge variant="success">{q.options.filter((o) => o.isCorrect).length ? "✓ উত্তর সেট" : "!"}</Badge>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-primary"
                    onClick={() => { setEditing(q); setFormOpen(true); }}>
                    <Pencil className="size-4" />
                  </button>
                  <button className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive" onClick={() => remove(q.id)}>
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
