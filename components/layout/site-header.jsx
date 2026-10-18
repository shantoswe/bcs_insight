"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Search, LayoutDashboard, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BrandMark } from "@/components/layout/brand-mark";
import { cn } from "@/lib/utils";

// Menu + labels come from site settings (admin → হেডার ও ফুটার). The list is
// only a fallback for the rare render without settings (e.g. a DB outage).
const FALLBACK_NAV = [
  { id: "n1", href: "/", label: "হোম" },
  { id: "n2", href: "/courses", label: "কোর্সসমূহ" },
  { id: "n3", href: "/exams", label: "মক টেস্ট" },
  { id: "n4", href: "/practice", label: "স্টাডি ম্যাটেরিয়ালস" },
  { id: "n5", href: "/written", label: "লিখিত" },
];

export function SiteHeader({ user, brand, settings }) {
  const cfg = settings ?? {};
  const nav = (Array.isArray(cfg["nav.menu"]) && cfg["nav.menu"].length ? cfg["nav.menu"] : FALLBACK_NAV)
    .filter((n) => n?.label && n?.href);
  const t = {
    search: cfg["header.searchPlaceholder"] || "কোর্স, বিষয় বা মক টেস্ট...",
    login: cfg["header.loginText"] || "লগইন",
    register: cfg["header.registerText"] || "রেজিস্টার",
    dashboard: cfg["header.dashboardText"] || "ড্যাশবোর্ড",
    admin: cfg["header.adminText"] || "অ্যাডমিন",
  };
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  const isStaff = user?.role === "ADMIN" || user?.role === "MODERATOR";

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  function search(e) {
    e.preventDefault();
    setSearchOpen(false);
    setOpen(false);
    router.push(q.trim() ? `/courses?q=${encodeURIComponent(q.trim())}` : "/courses");
  }

  // "/" must match exactly, every other item matches its sub-paths
  const active = (n) => (n.href === "/" ? pathname === "/" : pathname.startsWith(n.href));

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        {/* mobile menu */}
        <button
          className="-ml-1 p-1.5 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="মেনু"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <BrandMark siteName={brand?.siteName} logoUrl={brand?.logoUrl} size="md" className="shrink-0" />

        {/* desktop nav */}
        <nav className="ml-4 hidden items-center gap-0.5 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.id ?? n.href}
              href={n.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
                active(n) ? "text-primary" : "text-foreground/80"
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* desktop search */}
          <form onSubmit={search} className="hidden items-center rounded-lg border bg-card pl-3 xl:flex">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.search}
              aria-label="খুঁজুন"
              className="w-48 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button type="submit" aria-label="খুঁজুন"
              className="m-1 flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground transition hover:brightness-110">
              <Search className="size-4" />
            </button>
          </form>

          {/* compact search toggle */}
          <button className="p-2 xl:hidden" onClick={() => setSearchOpen((v) => !v)} aria-label="খুঁজুন">
            <Search className="size-5" />
          </button>

          {user ? (
            <>
              {isStaff && (
                <Link href="/admin" className="hidden rounded-lg px-3 py-2 text-sm font-medium hover:text-primary sm:block">
                  {t.admin}
                </Link>
              )}
              <Link
                href="/dashboard"
                className="hidden items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-semibold transition hover:border-primary/40 hover:text-primary sm:inline-flex"
              >
                <LayoutDashboard className="size-4" /> {t.dashboard}
              </Link>
              <button onClick={signOut} aria-label="সাইন আউট" className="p-2 text-muted-foreground hover:text-destructive">
                <LogOut className="size-5" />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg border px-3.5 py-2 text-sm font-semibold transition hover:border-primary/40 hover:text-primary"
              >
                {t.login}
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
              >
                {t.register}
              </Link>
            </>
          )}
        </div>
      </div>

      {/* compact search bar */}
      {searchOpen && (
        <form onSubmit={search} className="border-t bg-card px-4 py-3 xl:hidden">
          <div className="mx-auto flex max-w-6xl items-center rounded-lg border bg-background pl-3">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.search}
              className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"
            />
            <button type="submit" className="m-1 flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Search className="size-4" />
            </button>
          </div>
        </form>
      )}

      {/* mobile nav */}
      {open && (
        <nav className="border-t bg-card px-4 py-3 lg:hidden">
          <div className="mx-auto flex max-w-6xl flex-col">
            {nav.map((n) => (
              <Link
                key={n.id ?? n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-medium",
                  active(n) ? "bg-primary/8 text-primary" : "hover:bg-muted"
                )}
              >
                {n.label}
              </Link>
            ))}
            {user && (
              <>
                <div className="my-2 h-px bg-border" />
                <Link href="/dashboard" onClick={() => setOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted">
                  {t.dashboard}
                </Link>
                {isStaff && (
                  <Link href="/admin" onClick={() => setOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-muted">
                    অ্যাডমিন প্যানেল
                  </Link>
                )}
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
