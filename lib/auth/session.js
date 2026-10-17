import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { syncUserFromAuth } from "@/lib/services/user.service";
import { hasPermission, isStaff } from "@/lib/auth/permissions";
import { warnThrottled } from "@/lib/log";

// Server Component helpers (pages/layouts). API routes use lib/api/guard.js.
// cache() dedupes within a request so layout + page guards share one lookup.
export const getCurrentUser = cache(async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return null;
    return await syncUserFromAuth(authUser);
  } catch (err) {
    // Re-throw Next's framework control-flow signals (dynamic rendering,
    // redirect, notFound) — they carry a `digest` and must not be swallowed.
    if (err?.digest) throw err;
    // Real auth/DB outage — treat as logged-out rather than crashing the page.
    warnThrottled("auth-db", "[auth] Supabase unreachable — treating visitor as signed out.");
    return null;
  }
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.isBanned) redirect("/banned");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

// ADMIN or MODERATOR; optionally a specific permission key.
export async function requireStaff(permission = null) {
  const user = await requireUser();
  if (!isStaff(user) || !hasPermission(user, permission)) redirect("/dashboard");
  return user;
}
