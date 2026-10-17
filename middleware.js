import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Refreshes the Supabase session cookie on every request and does optimistic
// route gating. Authoritative checks always re-run in Server Components
// (lib/auth/session.js) and API routes (lib/api/guard.js).
export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  try {
    ({
      data: { user },
    } = await supabase.auth.getUser());
  } catch (err) {
    // Transient auth outage: don't 500 the whole site. Let the request through;
    // Server Component / API guards re-check and redirect if truly unauthed.
    if (!globalThis.__authWarned) { globalThis.__authWarned = true; console.warn("[middleware] Supabase auth unreachable — passing request through."); }
    return response;
  }

  const path = request.nextUrl.pathname;
  const isAuthPage = ["/login", "/register", "/forgot-password"].some((p) => path.startsWith(p));
  const isProtected = ["/dashboard", "/exams", "/attempts", "/written", "/practice", "/mistakes", "/profile", "/admin"].some(
    (p) => path.startsWith(p)
  );

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Optimistic admin gate via auth app_metadata (DB stays authoritative).
  if (path.startsWith("/admin") && user) {
    const role = user.app_metadata?.role;
    if (role && role !== "ADMIN" && role !== "MODERATOR") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  // Run on everything except static assets and the auth callback.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
