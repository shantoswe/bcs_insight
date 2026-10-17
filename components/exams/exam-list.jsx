"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Timer, FileText, Users, Lock, Radio, PlayCircle, Trophy } from "lucide-react";
import { get, post } from "@/lib/client-api";
import { cn, formatDateTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function ExamList() {
  return (
    <Tabs defaultValue="live">
      <TabsList>
        <TabsTrigger value="live"><Radio className="mr-1.5 size-4" /> লাইভ</TabsTrigger>
        <TabsTrigger value="archive"><FileText className="mr-1.5 size-4" /> প্র্যাকটিস ও আর্কাইভ</TabsTrigger>
      </TabsList>
      <TabsContent value="live"><Bucket bucket="live" /></TabsContent>
      <TabsContent value="archive"><Bucket bucket="archive" /></TabsContent>
    </Tabs>
  );
}

function Bucket({ bucket }) {
  const [state, setState] = useState({ loading: true, exams: [] });
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const exams = await get(`/api/v1/exams?bucket=${bucket}&limit=50`);
        setState({ loading: false, exams });
      } catch (e) {
        toast.error(e.message);
        setState({ loading: false, exams: [] });
      }
    })();
  }, [bucket]);

  if (state.loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
    );

  if (state.exams.length === 0)
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          {bucket === "live" ? "এই মুহূর্তে কোনো লাইভ পরীক্ষা নেই।" : "কোনো প্র্যাকটিস পরীক্ষা নেই।"}
        </CardContent>
      </Card>
    );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {state.exams.map((e) => {
        const upcoming = e.type === "LIVE" && e.startAt && new Date(e.startAt) > new Date();
        const done = e.myAttempt && ["SUBMITTED", "AUTO_SUBMITTED"].includes(e.myAttempt.status);
        return (
          <Card key={e.id} className="flex flex-col">
            <CardContent className="flex flex-1 flex-col p-5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant={e.type === "LIVE" ? "secondary" : "default"}>
                    {e.type === "LIVE" ? "লাইভ" : "প্র্যাকটিস"}
                  </Badge>
                  {e.category && <Badge variant="outline">{e.category.nameBn}</Badge>}
                  {e.locked && <Badge variant="warning"><Lock className="mr-1 size-3" /> কোর্স</Badge>}
                </div>
                {done && <Badge variant="success">সম্পন্ন</Badge>}
              </div>

              <h3 className="font-semibold leading-tight">{e.titleBn || e.titleEn}</h3>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><FileText className="size-4" /> {e._count.questions} প্রশ্ন</span>
                <span className="flex items-center gap-1"><Timer className="size-4" /> {e.durationMinutes} মিনিট</span>
                <span className="flex items-center gap-1"><Users className="size-4" /> {e._count.attempts}</span>
              </div>

              {e.type === "LIVE" && e.startAt && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {upcoming ? "শুরু: " : "শুরু হয়েছিল: "}
                  {formatDateTime(e.startAt)}
                </p>
              )}

              <div className="mt-auto pt-4">
                {done ? (
                  <Button variant="outline" className="w-full" onClick={() => router.push(`/attempts/${e.myAttempt.id}/result`)}>
                    <Trophy className="size-4" /> ফলাফল দেখুন
                  </Button>
                ) : e.locked ? (
                  <Button variant="outline" className="w-full" disabled>
                    <Lock className="size-4" /> কোর্সে ভর্তি প্রয়োজন
                  </Button>
                ) : upcoming ? (
                  <Button variant="outline" className="w-full" disabled>
                    শীঘ্রই শুরু হবে
                  </Button>
                ) : (
                  <Button className="w-full" onClick={() => router.push(`/exams/${e.id}`)}>
                    <PlayCircle className="size-4" />
                    {e.myAttempt?.status === "IN_PROGRESS" ? "চালিয়ে যান" : "শুরু করুন"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
