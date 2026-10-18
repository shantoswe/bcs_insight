import { Suspense } from "react";
import { PlayCircle } from "lucide-react";

import { listPublishedCourses } from "@/lib/services/course.service";
import { Card, CardContent } from "@/components/ui/card";
import { CourseBrowser } from "@/components/courses/course-browser";

export const metadata = { title: "ভিডিও কোর্স" };

export default async function CoursesPage() {
  const courses = await listPublishedCourses();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <PlayCircle className="size-6 text-secondary" /> ভিডিও কোর্স
        </h1>
        <p className="text-muted-foreground">প্রিলিমিনারি, লিখিত ও পরীক্ষা — সব কোর্স এক জায়গায়।</p>
      </div>

      {courses.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">এখন কোনো কোর্স প্রকাশিত হয়নি।</CardContent></Card>
      ) : (
        <Suspense fallback={null}><CourseBrowser courses={courses} /></Suspense>
      )}
    </div>
  );
}
