"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { UploadCloud, CheckCircle2, Loader2, Film } from "lucide-react";
import { post } from "@/lib/client-api";
import { TUS_ENDPOINT } from "@/lib/bunny";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// Direct browser → Bunny Stream upload via resumable TUS. The Bunny API key
// never reaches the browser: the server creates the video and returns a
// short-lived presigned signature; bytes go straight to Bunny, not our Node.
export function BunnyUpload({ onUploaded }) {
  const fileRef = useRef(null);
  const [phase, setPhase] = useState("idle"); // idle | creating | uploading | done | error
  const [pct, setPct] = useState(0);

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^video\//.test(file.type)) return toast.error("ভিডিও ফাইল নির্বাচন করুন");

    setPhase("creating");
    setPct(0);
    try {
      // 1) server creates the Bunny video + presigns the upload
      const presign = await post("/api/v1/admin/bunny/create-video", { title: file.name });

      // 2) resumable upload straight to Bunny
      const { Upload } = await import("tus-js-client");
      setPhase("uploading");

      await new Promise((resolve, reject) => {
        const upload = new Upload(file, {
          endpoint: TUS_ENDPOINT,
          retryDelays: [0, 1000, 3000, 5000],
          headers: {
            AuthorizationSignature: presign.signature,
            AuthorizationExpire: String(presign.expire),
            VideoId: presign.videoId,
            LibraryId: String(presign.libraryId),
          },
          metadata: { filetype: file.type, title: file.name },
          onError: reject,
          onProgress: (sent, total) => setPct(Math.round((sent / total) * 100)),
          onSuccess: resolve,
        });
        upload.start();
      });

      setPhase("done");
      toast.success("ভিডিও আপলোড হয়েছে — Bunny প্রসেসিং করছে");
      onUploaded?.(presign.videoId);
    } catch (err) {
      console.error(err);
      setPhase("error");
      toast.error("আপলোড ব্যর্থ হয়েছে");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <input ref={fileRef} type="file" accept="video/*" hidden onChange={onFile} />
      {phase === "uploading" || phase === "creating" ? (
        <div className="rounded-xl border bg-muted/40 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Loader2 className="size-4 animate-spin text-primary" />
            {phase === "creating" ? "প্রস্তুত হচ্ছে…" : `আপলোড হচ্ছে… ${pct}%`}
          </div>
          <Progress value={pct} />
        </div>
      ) : phase === "done" ? (
        <div className="flex items-center gap-2 rounded-xl border border-accent bg-accent/10 p-4 text-sm text-accent-foreground">
          <CheckCircle2 className="size-5" /> আপলোড সম্পন্ন — প্রসেসিং চলছে
        </div>
      ) : (
        <Button type="button" variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
          <UploadCloud className="size-4" /> ভিডিও আপলোড করুন (Bunny)
        </Button>
      )}
    </div>
  );
}
