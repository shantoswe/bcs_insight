"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Bookmark, CheckCircle2, Trash2 } from "lucide-react";
import { get, post } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MathText } from "@/components/ui/math-text";

export default function MistakesPage() {
  const [state, setState] = useState({ loading: true, items: [] });

  useEffect(() => {
    get("/api/v1/bookmarks")
      .then((items) => setState({ loading: false, items }))
      .catch((e) => {
        toast.error(e.message);
        setState({ loading: false, items: [] });
      });
  }, []);

  async function remove(qid) {
    try {
      await post("/api/v1/bookmarks", { questionId: qid });
      setState((s) => ({ ...s, items: s.items.filter((i) => i.id !== qid) }));
      toast.success("সরানো হয়েছে");
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Bookmark className="size-6 text-secondary" /> ভুল খাতা
        </h1>
        <p className="text-muted-foreground">সংরক্ষিত প্রশ্নগুলো এখানে পর্যালোচনা করুন।</p>
      </div>

      {state.loading ? (
        <div className="flex justify-center py-16"><Loader2 className="size-7 animate-spin text-primary" /></div>
      ) : state.items.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          এখনো কোনো প্রশ্ন সংরক্ষণ করেননি। প্র্যাকটিস বা পরীক্ষায় বুকমার্ক করুন।
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {state.items.map((q) => (
            <Card key={q.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <MathText as="p" className="font-medium">{q.textBn}</MathText>
                  <button onClick={() => remove(q.id)} title="সরান" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-4" />
                  </button>
                </div>
                {q.subject && <Badge variant="outline" className="mt-2">{q.subject.nameBn}</Badge>}
                <div className="mt-3 space-y-2">
                  {q.options.map((o, i) => (
                    <div key={o.id} className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                      o.isCorrect && "border-accent bg-accent/10"
                    )}>
                      <span className="font-semibold">{String.fromCharCode(65 + i)}.</span>
                      <span><MathText>{o.textBn}</MathText></span>
                      {o.isCorrect && <CheckCircle2 className="ml-auto size-4 text-accent" />}
                    </div>
                  ))}
                </div>
                {q.explanationBn && (
                  <div className="mt-3 rounded-lg bg-muted p-3 text-sm">
                    <span className="font-semibold text-primary">ব্যাখ্যা: </span><MathText>{q.explanationBn}</MathText>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
