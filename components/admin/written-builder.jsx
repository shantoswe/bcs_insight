"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ArrowLeft, Send, Save } from "lucide-react";
import { get, patch } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { WrittenSubmissions } from "@/components/admin/written-submissions";

const blank = () => ({ promptBn: "", modelAnswerBn: "", marks: 10 });

export function WrittenBuilder({ writtenExamId }) {
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await get(`/api/v1/admin/written/${writtenExamId}`);
      setExam(data);
      setQuestions(
        data.questions.length
          ? data.questions.map((q) => ({
              promptBn: q.promptBn,
              modelAnswerBn: q.modelAnswerBn ?? "",
              marks: Number(q.marks),
            }))
          : [blank()]
      );
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [writtenExamId]);

  useEffect(() => { load(); }, [load]);

  async function saveQuestions() {
    const valid = questions.filter((q) => q.promptBn.trim());
    if (valid.length === 0) return toast.error("কমপক্ষে একটি প্রশ্ন দিন");
    setSaving(true);
    try {
      await patch(`/api/v1/admin/written/${writtenExamId}`, {
        action: "questions",
        questions: valid.map((q) => ({
          promptBn: q.promptBn.trim(),
          modelAnswerBn: q.modelAnswerBn.trim() || null,
          marks: Number(q.marks) || 0,
        })),
      });
      toast.success("প্রশ্ন সংরক্ষিত হয়েছে");
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    try {
      await patch(`/api/v1/admin/written/${writtenExamId}`, { action: "publish" });
      toast.success("প্রকাশিত হয়েছে");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (loading)
    return <div className="flex justify-center py-16"><Loader2 className="size-7 animate-spin text-primary" /></div>;
  if (!exam) return null;

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3"><Link href="/admin/written"><ArrowLeft className="size-4" /> তালিকা</Link></Button>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{exam.titleBn || exam.titleEn}</h1>
          <Badge variant={exam.status === "PUBLISHED" ? "success" : "outline"}>{exam.status}</Badge>
        </div>
        {exam.status === "DRAFT" && <Button onClick={publish}><Send className="size-4" /> প্রকাশ করুন</Button>}
      </div>

      <Tabs defaultValue="questions">
        <TabsList>
          <TabsTrigger value="questions">প্রশ্ন ও মডেল উত্তর</TabsTrigger>
          <TabsTrigger value="submissions">জমা ও মূল্যায়ন</TabsTrigger>
        </TabsList>

        <TabsContent value="questions">
          <div className="space-y-3">
            {questions.map((q, i) => (
              <Card key={i}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">প্রশ্ন {i + 1}</span>
                    {questions.length > 1 && (
                      <button onClick={() => setQuestions((qs) => qs.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                    )}
                  </div>
                  <div className="space-y-1.5"><Label>প্রশ্ন</Label>
                    <Textarea value={q.promptBn} onChange={(e) => setQuestions((qs) => qs.map((x, idx) => idx === i ? { ...x, promptBn: e.target.value } : x))} />
                  </div>
                  <div className="space-y-1.5"><Label>মডেল উত্তর (শিক্ষার্থী সাবমিটের পর দেখবে)</Label>
                    <Textarea className="min-h-32" value={q.modelAnswerBn} onChange={(e) => setQuestions((qs) => qs.map((x, idx) => idx === i ? { ...x, modelAnswerBn: e.target.value } : x))} />
                  </div>
                  <div className="w-32 space-y-1.5"><Label>নম্বর</Label>
                    <Input type="number" value={q.marks} onChange={(e) => setQuestions((qs) => qs.map((x, idx) => idx === i ? { ...x, marks: e.target.value } : x))} />
                  </div>
                </CardContent>
              </Card>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setQuestions((qs) => [...qs, blank()])}><Plus className="size-4" /> প্রশ্ন যোগ</Button>
              <Button onClick={saveQuestions} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} সংরক্ষণ</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="submissions">
          <WrittenSubmissions writtenExamId={writtenExamId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
