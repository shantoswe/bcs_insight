import Link from "next/link";
import { PenLine, Timer, FileText } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listWrittenForStudent } from "@/lib/services/written.service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "লিখিত পরীক্ষা" };

export default async function WrittenPage() {
  await requireUser();
  const exams = await listWrittenForStudent();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <PenLine className="size-6 text-accent-foreground" /> লিখিত পরীক্ষা
        </h1>
        <p className="text-muted-foreground">বড় প্রশ্নের উত্তর লিখুন, মডেল উত্তর ও মূল্যায়ন পান।</p>
      </div>

      {exams.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">এখন কোনো লিখিত পরীক্ষা নেই।</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {exams.map((e) => (
            <Card key={e.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col p-5">
                <Badge variant="accent" className="w-fit">লিখিত</Badge>
                <h3 className="mt-2 font-semibold">{e.titleBn || e.titleEn}</h3>
                {e.descriptionBn && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{e.descriptionBn}</p>}
                <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><FileText className="size-4" /> {e._count.questions} প্রশ্ন</span>
                  <span className="flex items-center gap-1"><Timer className="size-4" /> {e.durationMinutes} মিনিট</span>
                </div>
                <Button asChild className="mt-auto pt-0"><Link href={`/written/${e.id}`}>শুরু করুন</Link></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
