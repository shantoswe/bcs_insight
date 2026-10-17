"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ListChecks, ClipboardList, PenLine, PlayCircle,
  FolderTree, Users, Settings, GraduationCap, LogOut, Menu, X, ExternalLink,
  Home, FolderOpen, Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/admin", label: "ড্যাশবোর্ড", icon: LayoutDashboard, perm: "dashboard", exact: true },
  { href: "/admin/questions", label: "প্রশ্ন ব্যাংক", icon: ListChecks, perm: "questions" },
  { href: "/admin/exams", label: "MCQ পরীক্ষা", icon: ClipboardList, perm: "exams" },
  { href: "/admin/written", label: "লিখিত পরীক্ষা", icon: PenLine, perm: "written" },
  { href: "/admin/courses", label: "ভিডিও কোর্স", icon: PlayCircle, perm: "courses" },
  { href: "/admin/payments", label: "পেমেন্ট অনুমোদন", icon: Wallet, perm: "courses" },
  { href: "/admin/taxonomy", label: "বিষয় ও টপিক", icon: FolderTree, perm: "taxonomy" },
  { href: "/admin/users", label: "ইউজার", icon: Users, perm: "users" },
  { href: "/admin/files", label: "ফাইল ম্যানেজার", icon: FolderOpen, perm: "settings" },
  { href: "/admin/settings/homepage", label: "হোমপেজ ও SEO", icon: Home, perm: "settings" },
  { href: "/admin/settings", label: "সেটিংস", icon: Settings, perm: "settings", exact: true },
];

export function AdminSidebar({ user }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const allowed = NAV.filter(
    (n) => user.role === "ADMIN" || user.permissions?.includes(n.perm)
  );

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const Links = () => (
    <nav className="space-y-1">
      {allowed.map((n) => {
        const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "brand-gradient text-white" : "text-foreground hover:bg-muted"
            )}
          >
            <n.icon className="size-4" /> {n.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-card px-4 py-3 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2 font-bold">
          <span className="flex size-8 items-center justify-center rounded-lg brand-gradient text-white">
            <GraduationCap className="size-4" />
          </span>
          অ্যাডমিন
        </Link>
        <button onClick={() => setOpen((v) => !v)}>{open ? <X /> : <Menu />}</button>
      </div>

      {open && (
        <div className="border-b bg-card p-4 lg:hidden">
          <Links />
        </div>
      )}

      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-card p-4 lg:flex">
        <Link href="/admin" className="mb-6 flex items-center gap-2 px-2 font-bold">
          <span className="flex size-9 items-center justify-center rounded-xl brand-gradient text-white">
            <GraduationCap className="size-5" />
          </span>
          <span>AUS Prep <span className="text-xs font-normal text-muted-foreground">Admin</span></span>
        </Link>
        <Links />
        <div className="mt-auto space-y-2 border-t pt-4">
          <Button asChild variant="outline" size="sm" className="w-full justify-start">
            <Link href="/dashboard"><ExternalLink className="size-4" /> সাইট দেখুন</Link>
          </Button>
          <div className="flex items-center gap-2 px-2 text-xs text-muted-foreground">
            <span className="truncate">{user.name}</span>
            <button onClick={signOut} className="ml-auto text-destructive hover:underline" title="সাইন আউট">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
