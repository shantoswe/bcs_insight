import { requireStaff } from "@/lib/auth/session";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const metadata = { title: "অ্যাডমিন" };

export default async function AdminLayout({ children }) {
  const user = await requireStaff();
  const safeUser = { name: user.name, role: user.role, permissions: user.permissions };
  return (
    <div className="flex min-h-screen flex-col bg-muted/20 lg:flex-row">
      <AdminSidebar user={safeUser} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
