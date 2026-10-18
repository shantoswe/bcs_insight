"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Loader2, Upload, ClipboardPaste, FileJson, FileDown, CheckCircle2, XCircle,
  AlertTriangle, Trash2, Check, ArrowLeft, Copy,
} from "lucide-react";
import { get, post } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const readText = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(file, "utf-8"); });
const readB64 = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1]); r.onerror = rej; r.readAsDataURL(file); });

export function ImportWizard({ onDone, examId }) {
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState(null); // editable preview
  const [subjects, setSubjects] = useState([]);
  const [pasteText, setPasteText] = useState("");
  const [jsonText, setJsonText] = useState("");
  const fileRef = useRef(null);
  const jsonRef = useRef(null);

  useEffect(() => {
    get("/api/v1/taxonomy")
      .then((tree) => setSubjects(tree.flatMap((c) => c.subjects.map((s) => ({ id: s.id, name: `${c.nameBn} · ${s.nameBn}`, topics: s.topics })))))
      .catch(() => {});
  }, []);

  async function parse(payload) {
    setBusy(true);
    try {
      const data = await post("/api/v1/admin/imports/parse", payload);
      setItems(data.items.map((it) => ({ ...it, include: it.errors.length === 0 && !it.duplicate })));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function onFile(e, kind) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (kind === "json") return parse({ format: "json", text: await readText(file) });
    const isExcel = /\.(xlsx|xls)$/i.test(file.name);
    return parse(isExcel ? { format: "xlsx", base64: await readB64(file) } : { format: "csv", text: await readText(file) });
  }

  async function save() {
    const questions = items.filter((i) => i.include).map((i) => i.question);
    if (questions.length === 0) return toast.error("সেভ করার মতো প্রশ্ন নেই");
    setBusy(true);
    try {
      const r = await post("/api/v1/admin/imports/save", { questions, examId: examId || null });
      toast.success(`${r.created}টি প্রশ্ন সংরক্ষিত${r.attached ? `, ${r.attached}টি পরীক্ষায় যুক্ত` : ""}${r.skipped ? `, ${r.skipped}টি বাদ` : ""}`);
      setItems(null);
      onDone?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  // ---- editable preview ----
  if (items) {
    const includedCount = items.filter((i) => i.include).length;
    return (
      <PreviewEditor
        items={items}
        setItems={setItems}
        subjects={subjects}
        busy={busy}
        includedCount={includedCount}
        onBack={() => setItems(null)}
        onSave={save}
      />
    );
  }

  // ---- input step ----
  return (
    <div className="space-y-4">
      <Tabs defaultValue="file">
        <TabsList className="flex-wrap">
          <TabsTrigger value="file"><Upload className="mr-1.5 size-4" /> CSV/Excel</TabsTrigger>
          <TabsTrigger value="jsonfile"><FileJson className="mr-1.5 size-4" /> JSON ফাইল</TabsTrigger>
          <TabsTrigger value="jsontext"><FileJson className="mr-1.5 size-4" /> JSON টেক্সট</TabsTrigger>
          <TabsTrigger value="paste"><ClipboardPaste className="mr-1.5 size-4" /> পেস্ট</TabsTrigger>
        </TabsList>

        <TabsContent value="file">
          <DropCard busy={busy} onClick={() => fileRef.current?.click()} hint=".csv, .xlsx" />
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" hidden onChange={(e) => onFile(e, "csv")} />
          <TemplateLinks />
        </TabsContent>

        <TabsContent value="jsonfile">
          <DropCard busy={busy} onClick={() => jsonRef.current?.click()} hint=".json — প্রশ্নের অ্যারে" icon={FileJson} />
          <input ref={jsonRef} type="file" accept=".json,application/json" hidden onChange={(e) => onFile(e, "json")} />
          <TemplateLinks />
        </TabsContent>

        <TabsContent value="jsontext">
          <Card><CardContent className="space-y-3 p-4">
            <p className="text-xs text-muted-foreground">প্রশ্নের JSON অ্যারে পেস্ট করুন। <code>options</code> স্ট্রিং বা <code>{`{text, image, correct}`}</code> অবজেক্ট হতে পারে।</p>
            <Textarea className="min-h-56 font-mono text-xs" value={jsonText} onChange={(e) => setJsonText(e.target.value)} placeholder='[{"subject":"math","question":"$x^2=16$ হলে x=?","options":["±4","4","-4","8"],"correct":0}]' />
            <Button onClick={() => jsonText.trim() ? parse({ format: "json-text", text: jsonText }) : toast.error("JSON পেস্ট করুন")} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} প্রিভিউ করুন
            </Button>
          </CardContent></Card>
          <TemplateLinks />
        </TabsContent>

        <TabsContent value="paste">
          <Card><CardContent className="space-y-3 p-4">
            <p className="text-xs text-muted-foreground">স্প্রেডশিট থেকে হেডারসহ সারি পেস্ট করুন (ট্যাব/কমা সেপারেটেড)।</p>
            <Textarea className="min-h-48 font-mono text-xs" value={pasteText} onChange={(e) => setPasteText(e.target.value)}
              placeholder={"subject\ttopic\tdifficulty\tsource\tyear\tquestion\timage\toption_a\toption_b\toption_c\toption_d\toption_e\tcorrect\texplanation"} />
            <Button onClick={() => pasteText.trim() ? parse({ format: "paste", text: pasteText }) : toast.error("প্রথমে পেস্ট করুন")} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} প্রিভিউ করুন
            </Button>
          </CardContent></Card>
          <TemplateLinks />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DropCard({ busy, onClick, hint, icon: Icon = Upload }) {
  return (
    <Card><CardContent className="p-6">
      <button onClick={onClick} disabled={busy}
        className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed py-10 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/40">
        {busy ? <Loader2 className="size-8 animate-spin" /> : <Icon className="size-8" />}
        <span className="text-sm font-medium">ফাইল নির্বাচন করুন</span>
        <span className="text-xs">{hint}</span>
      </button>
    </CardContent></Card>
  );
}

function TemplateLinks() {
  return (
    <div className="mt-3 flex items-center gap-3 text-xs">
      <span className="text-muted-foreground">টেমপ্লেট:</span>
      <a href="/api/v1/admin/imports/template?format=csv" className="flex items-center gap-1 text-primary hover:underline"><FileDown className="size-3.5" /> CSV</a>
      <a href="/api/v1/admin/imports/template?format=json" className="flex items-center gap-1 text-primary hover:underline"><FileDown className="size-3.5" /> JSON</a>
    </div>
  );
}

function PreviewEditor({ items, setItems, subjects, busy, includedCount, onBack, onSave }) {
  const okCount = items.filter((i) => i.errors.length === 0 && !i.duplicate).length;
  const dupCount = items.filter((i) => i.duplicate).length;
  const errCount = items.filter((i) => i.errors.length > 0).length;

  const update = (i, q) => setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, question: { ...it.question, ...q } } : it)));
  const toggle = (i) => setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, include: !it.include } : it)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="size-4" /> নতুন ফাইল</Button>
        <div className="flex gap-2 text-xs">
          <Badge variant="success">বৈধ {okCount}</Badge>
          <Badge variant="warning">ডুপ্লিকেট {dupCount}</Badge>
          <Badge variant="destructive">ত্রুটি {errCount}</Badge>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">নিচে প্রতিটি প্রশ্ন সম্পাদনা করুন। চেকবক্স দিয়ে কোনটি সেভ হবে ঠিক করুন।</p>

      <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
        {items.map((it, i) => (
          <PreviewCard key={i} item={it} idx={i} subjects={subjects} onUpdate={(q) => update(i, q)} onToggle={() => toggle(i)} />
        ))}
      </div>

      <div className="flex items-center justify-between border-t pt-3">
        <span className="text-sm text-muted-foreground">{includedCount}টি প্রশ্ন সেভ হবে</span>
        <Button onClick={onSave} disabled={busy || includedCount === 0}>
          {busy && <Loader2 className="size-4 animate-spin" />} {includedCount}টি প্রশ্ন সেভ করুন
        </Button>
      </div>
    </div>
  );
}

function PreviewCard({ item, idx, subjects, onUpdate, onToggle }) {
  const q = item.question;
  const setOpt = (oi, patch) => onUpdate({ options: q.options.map((o, i) => (i === oi ? { ...o, ...patch } : o)) });
  const setCorrect = (oi) => onUpdate({ options: q.options.map((o, i) => ({ ...o, isCorrect: i === oi })) });

  return (
    <Card className={cn("border-2", !item.include && "opacity-60", item.errors.length ? "border-destructive/30" : item.duplicate ? "border-secondary/30" : "border-accent/30")}>
      <CardContent className="space-y-2 p-3">
        <div className="flex items-start gap-2">
          <input type="checkbox" checked={item.include} onChange={onToggle} className="mt-1 size-4 accent-[var(--primary)]" />
          <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
          <div className="flex flex-1 flex-wrap gap-1">
            {item.errors.length === 0 && !item.duplicate && <Badge variant="success" className="text-[10px]"><Check className="mr-0.5 size-3" /> বৈধ</Badge>}
            {item.duplicate && <Badge variant="warning" className="text-[10px]">ডুপ্লিকেট</Badge>}
            {item.errors.map((e, k) => <Badge key={k} variant="destructive" className="text-[10px]">{e}</Badge>)}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Select value={q.subjectId || ""} onValueChange={(v) => onUpdate({ subjectId: v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={`বিষয় (${q.subjectName || "?"})`} /></SelectTrigger>
            <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={q.difficulty} onValueChange={(v) => onUpdate({ difficulty: v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="EASY">সহজ</SelectItem><SelectItem value="MEDIUM">মাঝারি</SelectItem><SelectItem value="HARD">কঠিন</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Textarea value={q.textBn} onChange={(e) => onUpdate({ textBn: e.target.value })} className="min-h-14 text-sm" placeholder="প্রশ্ন" />
        {q.imagePath && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={q.imagePath} alt="" className="max-h-20 rounded border" />
        )}

        <div className="space-y-1.5">
          {q.options.map((o, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <button type="button" onClick={() => setCorrect(oi)}
                className={cn("flex size-6 shrink-0 items-center justify-center rounded border-2 text-[10px] font-bold", o.isCorrect ? "border-accent bg-accent text-white" : "border-border")}>
                {o.isCorrect ? <Check className="size-3" /> : String.fromCharCode(65 + oi)}
              </button>
              <Input value={o.textBn} onChange={(e) => setOpt(oi, { textBn: e.target.value })} className="h-8 text-sm" placeholder={`অপশন ${String.fromCharCode(65 + oi)}`} />
              {o.imagePath && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={o.imagePath} alt="" className="h-8 rounded border" />
              )}
              {q.options.length > 2 && (
                <button type="button" onClick={() => onUpdate({ options: q.options.filter((_, i) => i !== oi) })} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button>
              )}
            </div>
          ))}
          {q.options.length < 5 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onUpdate({ options: [...q.options, { textBn: "", imagePath: "", isCorrect: false }] })}>+ অপশন</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
