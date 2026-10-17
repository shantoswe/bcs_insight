import { requireStaff } from "@/lib/auth/session";
import { HomepageEditor } from "@/components/admin/homepage-editor";

export default async function AdminHomepageSettings() {
  await requireStaff("settings");
  return (
    <div className="p-5 lg:p-8">
      <h1 className="text-2xl font-bold">হোমপেজ ও SEO</h1>
      <p className="mb-6 text-muted-foreground">হিরো, ভিডিও স্লাইডার, ব্যানার, রিভিউ ও সার্চ-ইঞ্জিন তথ্য সম্পাদনা করুন।</p>
      <HomepageEditor />
    </div>
  );
}
