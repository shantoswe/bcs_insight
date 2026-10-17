import { requireStaff } from "@/lib/auth/session";
import { UsersManager } from "@/components/admin/users-manager";

export default async function AdminUsersPage() {
  await requireStaff("users");
  return (
    <div className="p-5 lg:p-8">
      <h1 className="text-2xl font-bold">ইউজার</h1>
      <p className="mb-6 text-muted-foreground">রোল ও অনুমতি পরিচালনা করুন, প্রয়োজনে নিষিদ্ধ করুন।</p>
      <UsersManager />
    </div>
  );
}
