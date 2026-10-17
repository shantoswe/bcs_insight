import { requireStaff } from "@/lib/auth/session";
import { CourseBuilder } from "@/components/admin/course-builder";

export default async function AdminCourseBuilderPage({ params }) {
  await requireStaff("courses");
  const { id } = await params;
  return (
    <div className="p-5 lg:p-8">
      <CourseBuilder courseId={id} />
    </div>
  );
}
