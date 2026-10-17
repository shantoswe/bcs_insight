"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Search, Shield, Ban, Trash2, Check, SlidersHorizontal } from "lucide-react";
import { get, patch, del } from "@/lib/client-api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { ManageUserDialog } from "@/components/admin/manage-user-dialog";

const ROLE_VARIANT = { ADMIN: "default", MODERATOR: "secondary", STUDENT: "outline" };

export function UsersManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [roleDialog, setRoleDialog] = useState(null);
  const [manageUser, setManageUser] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ limit: "50" });
      if (search) q.set("search", search);
      if (roleFilter) q.set("role", roleFilter);
      setUsers(await get(`/api/v1/admin/users?${q}`));
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [search, roleFilter]);
  useEffect(() => { load(); }, [load]);

  async function toggleBan(u) {
    try {
      await patch(`/api/v1/admin/users/${u.id}`, {
        action: "ban", isBanned: !u.isBanned, banReason: !u.isBanned ? "Admin action" : null,
      });
      load();
    } catch (e) { toast.error(e.message); }
  }
  async function remove(u) {
    if (!confirm(`${u.name} কে স্থায়ীভাবে মুছে ফেলবেন?`)) return;
    try { await del(`/api/v1/admin/users/${u.id}`); load(); } catch (e) { toast.error(e.message); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="নাম, ইমেইল বা ফোন..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter || "all"} onValueChange={(v) => setRoleFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="রোল" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব রোল</SelectItem>
            <SelectItem value="STUDENT">শিক্ষার্থী</SelectItem>
            <SelectItem value="MODERATOR">মডারেটর</SelectItem>
            <SelectItem value="ADMIN">অ্যাডমিন</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="size-7 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <Card key={u.id}>
              <CardContent className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{u.name}</p>
                    <Badge variant={ROLE_VARIANT[u.role]}>{u.role}</Badge>
                    {u.isBanned && <Badge variant="destructive">নিষিদ্ধ</Badge>}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {u.email}{u.phone ? ` · ${u.phone}` : ""} · {u._count.attempts} পরীক্ষা · যোগদান {formatDateTime(u.createdAt)}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => setManageUser(u)}><SlidersHorizontal className="size-4" /> ম্যানেজ</Button>
                  <Button variant="outline" size="sm" onClick={() => setRoleDialog(u)}><Shield className="size-4" /> রোল</Button>
                  <Button variant="ghost" size="icon" onClick={() => toggleBan(u)} title={u.isBanned ? "মুক্ত করুন" : "নিষিদ্ধ করুন"}>
                    <Ban className={u.isBanned ? "size-4 text-destructive" : "size-4"} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(u)}><Trash2 className="size-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {roleDialog && <RoleDialog user={roleDialog} onClose={() => setRoleDialog(null)} onSaved={() => { setRoleDialog(null); load(); }} />}
      {manageUser && <ManageUserDialog user={manageUser} onClose={() => setManageUser(null)} />}
    </div>
  );
}

function RoleDialog({ user, onClose, onSaved }) {
  const [role, setRole] = useState(user.role);
  const [perms, setPerms] = useState(user.permissions ?? []);
  const [saving, setSaving] = useState(false);

  function toggle(key) {
    setPerms((p) => (p.includes(key) ? p.filter((x) => x !== key) : [...p, key]));
  }

  async function save() {
    setSaving(true);
    try {
      await patch(`/api/v1/admin/users/${user.id}`, { action: "role", role, permissions: role === "MODERATOR" ? perms : [] });
      toast.success("রোল হালনাগাদ হয়েছে");
      onSaved();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>রোল পরিবর্তন — {user.name}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="STUDENT">শিক্ষার্থী</SelectItem>
              <SelectItem value="MODERATOR">মডারেটর (নির্দিষ্ট অনুমতি)</SelectItem>
              <SelectItem value="ADMIN">অ্যাডমিন (সব অনুমতি)</SelectItem>
            </SelectContent>
          </Select>

          {role === "MODERATOR" && (
            <div>
              <p className="mb-2 text-sm font-medium">অনুমতি</p>
              <div className="grid grid-cols-2 gap-2">
                {PERMISSIONS.map((p) => (
                  <button key={p.key} onClick={() => toggle(p.key)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${perms.includes(p.key) ? "border-primary bg-primary/8" : ""}`}>
                    <span className={`flex size-4 items-center justify-center rounded border ${perms.includes(p.key) ? "border-primary bg-primary text-white" : ""}`}>
                      {perms.includes(p.key) && <Check className="size-3" />}
                    </span>
                    {p.bn}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={saving}>{saving && <Loader2 className="size-4 animate-spin" />} সংরক্ষণ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
