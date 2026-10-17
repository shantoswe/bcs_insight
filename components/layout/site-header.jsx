"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { GraduationCap, Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/layout/notification-bell";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/exams", label: "পরীক্ষা" },
  { href: "/practice", label: "প্র্যাকটিস" },
  { href: "/written", label: "লিখিত" },
  { href: "/courses", label: "কোর্স" },
];

export function SiteHeader({ user }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const isStaff = user?.role === "ADMIN" || user?.role === "MODERATOR";

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="flex size-9 items-center justify-center rounded-xl brand-gradient text-white">
            <GraduationCap className="size-5" />
          </span>
          <span className="text-lg tracking-tight">AUS Prep</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                pathname.startsWith(n.href) && "text-primary"
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <NotificationBell />
              {isStaff && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin">অ্যাডমিন</Link>
                </Button>
              )}
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">
                  <LayoutDashboard className="size-4" /> ড্যাশবোর্ড
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} title="সাইন আউট">
                <LogOut className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">লগইন</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">রেজিস্টার</Link>
              </Button>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t bg-background px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                {n.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-border" />
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">
                  ড্যাশবোর্ড
                </Link>
                {isStaff && (
                  <Link href="/admin" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">
                    অ্যাডমিন প্যানেল
                  </Link>
                )}
                <button onClick={signOut} className="rounded-lg px-3 py-2 text-left text-sm font-medium text-destructive hover:bg-muted">
                  সাইন আউট
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-1">
                <Button asChild variant="outline" className="flex-1"><Link href="/login">লগইন</Link></Button>
                <Button asChild className="flex-1"><Link href="/register">রেজিস্টার</Link></Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
