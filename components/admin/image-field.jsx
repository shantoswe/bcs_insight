"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { post } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Image upload + URL field shared by every admin editor (logo, favicon,
// banners, thumbnails). Uploads land in the public "files" bucket.
export function ImageField({ label, value, onChange, className, folder = "site", hint }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);

  async function upload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);
      const { url } = await post("/api/v1/admin/files", fd);
      onChange(url);
      toast.success("আপলোড হয়েছে");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      {label && <Label className="text-xs">{label}</Label>}
      <div className="flex items-center gap-2">
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="size-10 rounded border bg-card object-contain" />
        )}
        <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="URL বা আপলোড" className="flex-1" />
        <Button type="button" variant="outline" size="icon" onClick={() => ref.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        </Button>
        <input ref={ref} type="file" accept="image/*" hidden onChange={upload} />
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
