import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getCourseBySlug } from "@/lib/services/course.service";
import { getSettings } from "@/lib/services/settings.service";
import { CoursePlayer } from "@/components/courses/course-player";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return { title: slug };
}

export default async function CourseDetailPage({ params }) {
  const user = await getCurrentUser();
  const { slug } = await params;
  const course = await getCourseBySlug(slug, user?.id ?? null);
  if (!course || !course.isPublished) notFound();

  const settings = await getSettings();
  const paymentConfig = {
    methods: settings["payment.methods"] ?? [],
    instructions: settings["payment.instructions"] ?? "",
  };

  return <CoursePlayer course={course} paymentConfig={paymentConfig} isLoggedIn={!!user} />;
}
