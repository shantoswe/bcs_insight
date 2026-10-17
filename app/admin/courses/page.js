import { requireStaff } from "@/lib/auth/session";
import { CoursesManager } from "@/components/admin/courses-manager";

export default async function AdminCoursesPage() {
  await requireStaff("courses");
  return (
    <div className="p-5 lg:p-8">
      <h1 className="text-2xl font-bold">ভিডিও কোর্স</h1>
      <p className="mb-6 text-muted-foreground">কোর্স, সেকশন ও ভিডিও লেসন তৈরি করুন — ভিডিও সরাসরি Bunny-তে আপলোড হয়।</p>
      <CoursesManager />
    </div>
  );
}
