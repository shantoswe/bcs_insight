"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Search, UserPlus, Trash2, Users } from "lucide-react";
import { get, post } from "@/lib/client-api";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CourseStudents({ courseId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await get(`/api/v1/admin/courses/${courseId}/enrollments`)); }
    catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }, [courseId]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setSearching(true);
      try { setResults(await get(`/api/v1/admin/users/search?q=${encodeURIComponent(query)}`)); }
      catch { /* ignore */ }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [query]);

  const enrolledIds = new Set(rows.map((r) => r.user.id));

  async function enroll(userId) {
    try {
      await post(`/api/v1/admin/courses/${courseId}/enrollments`, { userId });
      toast.success("যুক্ত হয়েছে");
      setQuery("");
      setResults([]);
      load();
    } catch (e) { toast.error(e.message); }
  }
  async function remove(userId) {
    if (!confirm("এই শিক্ষার্থীকে সরাবেন?")) return;
    try { await post(`/api/v1/admin/courses/${courseId}/enrollments`, { userId, action: "remove" }); load(); }
    catch (e) { toast.error(e.message); }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* assign */}
      <div>
        <h3 className="mb-2 flex items-center gap-2 font-semibold"><UserPlus className="size-4" /> শিক্ষার্থী যুক্ত করুন</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="নাম, ইমেইল বা ফোন..." value={query} onChange={(e) => setQuery(e.target.value)} />
          {searching && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
        </div>
        {results.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {results.map((u) => (
              <Card key={u.id}>
                <CardContent className="flex items-center gap-2 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{u.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
                  </div>
                  {enrolledIds.has(u.id) ? (
                    <Badge variant="success">যুক্ত</Badge>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => enroll(u.id)}><UserPlus className="size-4" /> যুক্ত</Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* enrolled list */}
      <div>
        <h3 className="mb-2 flex items-center gap-2 font-semibold"><Users className="size-4" /> ভর্তি শিক্ষার্থী ({rows.length})</h3>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : rows.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">এখনো কেউ ভর্তি হয়নি।</CardContent></Card>
        ) : (
          <div className="space-y-1.5">
            {rows.map((r) => (
              <Card key={r.user.id}>
                <CardContent className="flex items-center gap-2 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.user.nameBn || r.user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.user.email} · {formatDateTime(r.enrolledAt)}</p>
                  </div>
                  <button onClick={() => remove(r.user.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
