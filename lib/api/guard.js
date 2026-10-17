import { createClient } from "@/lib/supabase/server";
import { syncUserFromAuth } from "@/lib/services/user.service";
import { fail } from "@/lib/api/response";
import { rateLimit, clientIp } from "@/lib/api/rate-limit";
import { mapPrismaError } from "@/lib/api/prisma-errors";
import { ApiError } from "@/lib/api/errors";
import { hasPermission, isStaff, permissionForPath } from "@/lib/auth/permissions";

// Wraps a route handler with auth (and optional role) checks.
//
//   export const GET = withAuth(async (request, ctx) => { ... })
//   export const POST = withAdmin(handler)             // ADMIN or permitted MODERATOR
//
// ctx = { user (db row), authUser (supabase), params, supabase }
export function withAuth(handler, { role = null, limit = 120, windowMs = 60_000 } = {}) {
  return async (request, routeCtx = {}) => {
    try {
      const supabase = await createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) return fail("Unauthorized", { status: 401 });

      const rl = rateLimit(`${authUser.id}:${new URL(request.url).pathname}`, { limit, windowMs });
      if (!rl.ok) return fail("Too many requests", { status: 429 });

      const user = await syncUserFromAuth(authUser);

      if (user.isBanned)
        return fail("Your account has been banned", {
          status: 403,
          meta: { reason: user.banReason },
        });

      if (role === "STAFF") {
        const permission = permissionForPath(new URL(request.url).pathname);
        if (!isStaff(user) || !hasPermission(user, permission))
          return fail("Forbidden", { status: 403 });
      } else if (role && user.role !== role) {
        return fail("Forbidden", { status: 403 });
      }

      const params = routeCtx.params ? await routeCtx.params : {};
      return await handler(request, { user, authUser, params, supabase });
    } catch (err) {
      if (err instanceof ApiError) return fail(err.message, { status: err.status });
      const mapped = mapPrismaError(err);
      if (mapped) return fail(mapped.message, { status: mapped.status });
      console.error(`[api] ${request.method} ${request.url}`, err);
      return fail("Internal server error", { status: 500 });
    }
  };
}

// Staff guard: ADMIN has everything; MODERATOR checked against the path permission.
export const withAdmin = (handler, opts = {}) => withAuth(handler, { ...opts, role: "STAFF" });

// Unauthenticated routes that still need rate limiting.
export function withPublic(handler, { limit = 60, windowMs = 60_000 } = {}) {
  return async (request, routeCtx = {}) => {
    try {
      const rl = rateLimit(`ip:${clientIp(request)}:${new URL(request.url).pathname}`, {
        limit,
        windowMs,
      });
      if (!rl.ok) return fail("Too many requests", { status: 429 });
      const params = routeCtx.params ? await routeCtx.params : {};
      return await handler(request, { params });
    } catch (err) {
      if (err instanceof ApiError) return fail(err.message, { status: err.status });
      const mapped = mapPrismaError(err);
      if (mapped) return fail(mapped.message, { status: mapped.status });
      console.error(`[api] ${request.method} ${request.url}`, err);
      return fail("Internal server error", { status: 500 });
    }
  };
}
