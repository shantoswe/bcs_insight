import { requireStaff } from "@/lib/auth/session";
import { MenuEditor } from "@/components/admin/menu-editor";

export default async function AdminMenuSettings() {
  await requireStaff("settings");
  return (
    <div className="p-5 lg:p-8">
      <h1 className="text-2xl font-bold">হেডার ও ফুটার</h1>
      <p className="mb-6 text-muted-foreground">মেনু যোগ/সম্পাদনা, বাটনের লেখা, ফুটারের লিংক কলাম ও কপিরাইট পরিবর্তন করুন।</p>
      <MenuEditor />
    </div>
  );
}
