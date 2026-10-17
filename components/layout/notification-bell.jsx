"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Loader2, Megaphone, Radio, Trophy } from "lucide-react";
import { get, post } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TYPE_ICON = {
  ANNOUNCEMENT: { icon: Megaphone, cls: "text-primary" },
  EXAM_REMINDER: { icon: Radio, cls: "text-secondary" },
  RESULT_PUBLISHED: { icon: Trophy, cls: "text-[oklch(0.65_0.15_75)]" },
  SYSTEM: { icon: Bell, cls: "text-muted-foreground" },
};

const ago = (d) => {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))} মিনিট আগে`;
  if (s < 86400) return `${Math.floor(s / 3600)} ঘণ্টা আগে`;
  return new Date(d).toLocaleDateString("bn-BD", { dateStyle: "medium" });
};

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/me/notifications");
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
        setUnread(json.meta?.unread ?? 0);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function openItem(n) {
    if (!n.isRead) {
      setUnread((u) => Math.max(0, u - 1));
      setItems((list) => list?.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      post("/api/v1/me/notifications", { ids: [n.id] }).catch(() => {});
    }
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  }

  async function markAllRead() {
    setUnread(0);
    setItems((list) => list?.map((n) => ({ ...n, isRead: true })));
    post("/api/v1/me/notifications", { all: true }).catch(() => {});
  }

  return (
    <DropdownMenu open={open} onOpenChange={(o) => { setOpen(o); if (o) load(); }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="নোটিফিকেশন">
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold">নোটিফিকেশন</p>
          {unread > 0 && (
            <button type="button" onClick={markAllRead} className="flex items-center gap-1 text-xs text-accent-foreground hover:underline">
              <CheckCheck className="size-3.5" /> সব পড়া হয়েছে
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading && !items ? (
            <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-primary" /></div>
          ) : !items || items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">কোনো নোটিফিকেশন নেই</p>
          ) : (
            items.map((n) => {
              const t = TYPE_ICON[n.type] ?? TYPE_ICON.SYSTEM;
              const Icon = t.icon;
              return (
                <button key={n.id} onClick={() => openItem(n)}
                  className={cn("flex w-full items-start gap-3 border-b px-3 py-3 text-left transition-colors last:border-0 hover:bg-muted/60", !n.isRead && "bg-primary/5")}>
                  <Icon className={cn("mt-0.5 size-4 shrink-0", t.cls)} />
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm", !n.isRead && "font-semibold")}>{n.title}</p>
                    {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>}
                    <p className="mt-1 text-[11px] text-muted-foreground">{ago(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-secondary" />}
                </button>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
