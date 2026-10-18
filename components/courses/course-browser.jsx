"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PlayCircle, Layers, Users } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TYPE_LABEL = {
  PRELIMINARY: "প্রিলিমিনারি",
  WRITTEN: "লিখিত",
  EXAM: "পরীক্ষা",
  GENERAL: "সাধারণ",
};

// All courses in one place, filterable by track (Preliminary / Written / Exam).
export function CourseBrowser({ courses }) {
  const [tab, setTab] = useState("ALL");
  const sp = useSearchParams();
  const q = (sp.get("q") || "").trim().toLowerCase();
  const categorySlug = (sp.get("category") || "").trim();

  // only show tabs for types that actually have courses
  const presentTypes = useMemo(
    () => ["PRELIMINARY", "WRITTEN", "EXAM", "GENERAL"].filter((t) => courses.some((c) => c.courseType === t)),
    [courses]
  );
  const byCategory = categorySlug ? courses.filter((c) => c.category?.slug === categorySlug) : courses;
  const filtered = (tab === "ALL" ? byCategory : byCategory.filter((c) => c.courseType === tab)).filter((c) =>
    !q || `${c.titleBn ?? ""} ${c.titleEn ?? ""} ${c.descriptionBn ?? ""}`.toLowerCase().includes(q)
  );
  const categoryName = categorySlug ? (courses.find((c) => c.category?.slug === categorySlug)?.category?.nameBn ?? categorySlug) : "";

  return (
    <div>
      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="ALL">সব কোর্স</TabsTrigger>
          {presentTypes.map((t) => (
            <TabsTrigger key={t} value={t}>{TYPE_LABEL[t]}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {categorySlug && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">ক্যাটাগরি: {categoryName}</span>
          <Link href="/courses" className="text-muted-foreground hover:text-primary">সব কোর্স দেখুন ✕</Link>
        </div>
      )}

      {q && (
        <p className="mb-4 text-sm text-muted-foreground">
          “<span className="font-medium text-foreground">{q}</span>” — {filtered.length}টি কোর্স পাওয়া গেছে
        </p>
      )}

      {filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">এই বিভাগে কোনো কোর্স নেই।</CardContent></Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const free = c.isFree || Number(c.priceBDT) === 0;
            return (
              <Link key={c.id} href={`/courses/${c.slug}`}>
                <Card className="flex h-full flex-col overflow-hidden transition-transform hover:-translate-y-1">
                  <div className="brand-gradient relative flex aspect-video items-center justify-center">
                    {c.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <PlayCircle className="size-12 text-white/80" />
                    )}
                    <Badge className="absolute left-2 top-2 bg-white/90 text-primary">{TYPE_LABEL[c.courseType]}</Badge>
                  </div>
                  <CardContent className="flex flex-1 flex-col p-4">
                    {c.category && <Badge variant="outline" className="w-fit">{c.category.nameBn}</Badge>}
                    <h3 className="mt-2 font-semibold leading-tight">{c.titleBn || c.titleEn}</h3>
                    <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Layers className="size-3.5" /> {c._count.sections} সেকশন</span>
                      <span className="flex items-center gap-1"><Users className="size-3.5" /> {c._count.enrollments}</span>
                    </div>
                    <div className="mt-auto pt-3">
                      {free ? <Badge variant="success">ফ্রি</Badge> : <span className="font-bold text-primary">{formatBDT(c.priceBDT)}</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
