"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Search, ArrowLeft, ListChecks, Pencil } from "lucide-react";
import { get, post } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MathText } from "@/components/ui/math-text";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { QuestionForm } from "@/components/admin/question-form";
import { ImportWizard } from "@/components/admin/import-wizard";
import { Upload } from "lucide-react";

export function ExamBuilder({ examId }) {
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [tree, setTree] = useState([]);
  const [editing, setEditing] = useState(null); // question being edited
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => { get("/api/v1/taxonomy").then(setTree).catch(() => {}); }, []);

  const load = useCallback(async () => {
    try {
      setExam(await get(`/api/v1/admin/exams/${examId}`));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => { load(); }, [load]);

  async function doSearch() {
    setSearching(true);
    try {
      const q = new URLSearchParams({ excludeExamId: examId });
      if (search) q.set("search", search);
      setResults(await get(`/api/v1/admin/questions/search?${q}`));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSearching(false);
    }
  }

  async function attach(ids) {
    try {
      await post(`/api/v1/admin/exams/${examId}/questions`, { questionIds: ids });
      setResults((r) => r.filter((q) => !ids.includes(q.id)));
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function removeQ(questionId) {
    try {
      await post(`/api/v1/admin/exams/${examId}/questions`, { action: "remove", questionId });
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function setMarks(questionId, marks) {
    try {
      await post(`/api/v1/admin/exams/${examId}/questions`, { action: "marks", questionId, marks });
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (loading)
    return <div className="flex justify-center py-16"><Loader2 className="size-7 animate-spin text-primary" /></div>;
  if (!exam) return <p className="text-muted-foreground">পরীক্ষা পাওয়া যায়নি।</p>;

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3"><Link href="/admin/exams"><ArrowLeft className="size-4" /> পরীক্ষার তালিকা</Link></Button>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{exam.titleBn || exam.titleEn}</h1>
          <p className="text-muted-foreground">
            {exam.questions.length} প্রশ্ন · মোট নম্বর {Number(exam.totalMarks)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>এই পরীক্ষায় বাল্ক আপলোড</DialogTitle></DialogHeader>
              <ImportWizard examId={examId} onDone={() => { setImportOpen(false); load(); }} />
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}><Upload className="size-4" /> বাল্ক আপলোড</Button>
          <Badge variant={exam.type === "LIVE" ? "secondary" : "default"}>{exam.type === "LIVE" ? "লাইভ" : "প্র্যাকটিস"}</Badge>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* attached */}
        <div>
          <h2 className="mb-2 flex items-center gap-2 font-semibold"><ListChecks className="size-4" /> সংযুক্ত প্রশ্ন</h2>
          {exam.questions.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">এখনো কোনো প্রশ্ন যোগ করা হয়নি।</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {exam.questions.map((eq) => (
                <Card key={eq.id}>
                  <CardContent className="flex items-start gap-2 p-3">
                    <span className="mt-0.5 text-xs font-semibold text-muted-foreground">{eq.order + 1}.</span>
                    <div className="min-w-0 flex-1">
                      <MathText as="p" className="line-clamp-2 text-sm">{eq.question.textBn}</MathText>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{eq.question.subject?.nameBn}</Badge>
                        <label className="flex items-center gap-1 text-xs text-muted-foreground">
                          নম্বর:
                          <Input
                            type="number" step="0.5" defaultValue={Number(eq.marks)}
                            className="h-7 w-16"
                            onBlur={(e) => setMarks(eq.questionId, Number(e.target.value) || 1)}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <button onClick={() => setEditing(eq.question)} className="text-muted-foreground hover:text-primary" title="প্রশ্ন সম্পাদনা"><Pencil className="size-4" /></button>
                      <button onClick={() => removeQ(eq.questionId)} className="text-muted-foreground hover:text-destructive" title="সরান"><Trash2 className="size-4" /></button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>প্রশ্ন সম্পাদনা</DialogTitle></DialogHeader>
            {editing && <QuestionForm tree={tree} initial={editing} onSaved={() => { setEditing(null); load(); }} />}
          </DialogContent>
        </Dialog>

        {/* add */}
        <div>
          <h2 className="mb-2 flex items-center gap-2 font-semibold"><Plus className="size-4" /> প্রশ্ন যোগ করুন</h2>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="প্রশ্ন ব্যাংকে খুঁজুন..." value={search}
                onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doSearch()} />
            </div>
            <Button variant="outline" onClick={doSearch} disabled={searching}>
              {searching ? <Loader2 className="size-4 animate-spin" /> : "খুঁজুন"}
            </Button>
          </div>
          {results.length > 0 && (
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => attach(results.map((r) => r.id))}>
              <Plus className="size-4" /> সব যোগ করুন ({results.length})
            </Button>
          )}
          <div className="mt-2 space-y-2">
            {results.map((q) => (
              <Card key={q.id}>
                <CardContent className="flex items-start gap-2 p-3">
                  <div className="min-w-0 flex-1">
                    <MathText as="p" className="line-clamp-2 text-sm">{q.textBn}</MathText>
                    <Badge variant="outline" className="mt-1 text-[10px]">{q.subject?.nameBn}</Badge>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => attach([q.id])}><Plus className="size-4" /></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
