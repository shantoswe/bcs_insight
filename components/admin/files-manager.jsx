"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Loader2, Folder, FileText, Image as ImageIcon, Film, Music, Trash2, Upload, ChevronRight, Home, Copy, ExternalLink,
} from "lucide-react";
import { get, post } from "@/lib/client-api";
import { formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const BUCKETS = [
  { id: "files", label: "Files (public)" },
  { id: "question-images", label: "প্রশ্নের ছবি" },
  { id: "course-assets", label: "কোর্স অ্যাসেট" },
  { id: "avatars", label: "অ্যাভাটার" },
];

function iconFor(item) {
  if (item.isFolder) return Folder;
  const m = item.mimeType || "";
  if (m.startsWith("image/")) return ImageIcon;
  if (m.startsWith("video/")) return Film;
  if (m.startsWith("audio/")) return Music;
  return FileText;
}
function fmtSize(b) {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function FilesManager() {
  const [bucket, setBucket] = useState("files");
  const [prefix, setPrefix] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await get(`/api/v1/admin/files?bucket=${bucket}&prefix=${encodeURIComponent(prefix)}`);
      setData(d);
    } catch (e) {
      toast.error(e.message);
      setData({ items: [] });
    } finally {
      setLoading(false);
    }
  }, [bucket, prefix]);

  useEffect(() => { load(); }, [load]);

  async function remove(item) {
    if (item.isFolder) return toast.info("ফোল্ডার মুছতে ভেতরের ফাইল মুছুন");
    if (!confirm(`"${item.name}" মুছে ফেলবেন?`)) return;
    try {
      await post("/api/v1/admin/files", { action: "delete", bucket, path: item.path });
      load();
    } catch (e) { toast.error(e.message); }
  }

  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", prefix || "site");
      await post("/api/v1/admin/files", fd);
      toast.success("আপলোড হয়েছে");
      if (bucket === "files") load();
    } catch (e) { toast.error(e.message); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  const crumbs = prefix ? prefix.split("/") : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={bucket} onValueChange={(v) => { setBucket(v); setPrefix(""); }}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>{BUCKETS.map((b) => <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>)}</SelectContent>
        </Select>
        <div className="flex-1" />
        {bucket === "files" && (
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} আপলোড
          </Button>
        )}
        <input ref={fileRef} type="file" hidden onChange={upload} />
      </div>

      {/* breadcrumb */}
      <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <button onClick={() => setPrefix("")} className="flex items-center gap-1 hover:text-primary"><Home className="size-3.5" /> {bucket}</button>
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="size-3.5" />
            <button onClick={() => setPrefix(crumbs.slice(0, i + 1).join("/"))} className="hover:text-primary">{c}</button>
          </span>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="size-7 animate-spin text-primary" /></div>
      ) : !data?.items?.length ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">এই ফোল্ডারে কিছু নেই।</CardContent></Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((it) => {
            const Icon = iconFor(it);
            const isImg = it.mimeType?.startsWith("image/");
            return (
              <Card key={it.path} className="group">
                <CardContent className="flex items-center gap-3 p-3">
                  <button
                    onClick={() => it.isFolder ? setPrefix(it.path) : null}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    {isImg && it.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.url} alt="" className="size-10 shrink-0 rounded object-cover" />
                    ) : (
                      <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${it.isFolder ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        <Icon className="size-5" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{it.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {it.isFolder ? "ফোল্ডার" : `${fmtSize(it.size)}${it.createdAt ? " · " + formatDateTime(it.createdAt) : ""}`}
                      </p>
                    </div>
                  </button>
                  {!it.isFolder && (
                    <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      {it.url && (
                        <>
                          <button onClick={() => { navigator.clipboard.writeText(it.url); toast.success("লিংক কপি হয়েছে"); }} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-primary" title="লিংক কপি"><Copy className="size-3.5" /></button>
                          <a href={it.url} target="_blank" rel="noreferrer" className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-primary" title="খুলুন"><ExternalLink className="size-3.5" /></a>
                        </>
                      )}
                      <button onClick={() => remove(it)} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive" title="মুছুন"><Trash2 className="size-3.5" /></button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
