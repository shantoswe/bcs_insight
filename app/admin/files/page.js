import { requireStaff } from "@/lib/auth/session";
import { FilesManager } from "@/components/admin/files-manager";

export default async function AdminFilesPage() {
  await requireStaff("settings");
  return (
    <div className="p-5 lg:p-8">
      <h1 className="text-2xl font-bold">ফাইল ম্যানেজার</h1>
      <p className="mb-6 text-muted-foreground">স্টোরেজের ফাইল ব্রাউজ, আপলোড ও মুছে ফেলুন।</p>
      <FilesManager />
    </div>
  );
}
