import { requireStaff } from "@/lib/auth/session";
import { getBrand } from "@/lib/services/settings.service";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const metadata = { title: "অ্যাডমিন" };

export default async function AdminLayout({ children }) {
  const user = await requireStaff();
  let brand = { siteName: "BCS Insight", logoUrl: "" };
  try { brand = await getBrand(); } catch {}
  const safeUser = { name: user.name, role: user.role, permissions: user.permissions };
  return (
    <div className="flex min-h-screen flex-col bg-muted/20 lg:flex-row">
      <AdminSidebar user={safeUser} brand={brand} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
