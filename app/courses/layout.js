import { getCurrentUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/services/settings.service";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

// Course browsing is public — visitors can explore before signing up.
// Enrolling and watching lessons still require an account.
export default async function CoursesLayout({ children }) {
  const user = await getCurrentUser();
  let settings = {};
  try { settings = await getSettings(); } catch {}
  const brand = { siteName: settings.siteName || "BCS Insight", logoUrl: settings.logoUrl || "" };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={user} brand={brand} settings={settings} />
      <main className="flex-1">{children}</main>
      <SiteFooter brand={brand} settings={settings} />
    </div>
  );
}
