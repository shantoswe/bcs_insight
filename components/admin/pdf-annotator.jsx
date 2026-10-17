"use client";

import { useEffect, useRef, useState, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Save, Pen, Type, Eraser, Undo2, Loader2, ZoomIn, ZoomOut, CheckCircle2, X, Hand } from "lucide-react";

// In-browser answer-sheet annotator (Alokbortika-style): renders the student's
// PDF, lets the evaluator draw/erase/add text with a smooth freehand pen, then
// burns the vector marks into a new PDF and uploads it. pdf.js loads from CDN;
// pdf-lib + perfect-freehand load on demand.

function toSvgPath(pts) {
  if (!pts.length) return "";
  const d = pts.reduce((acc, [x0, y0], i, arr) => {
    const [x1, y1] = arr[(i + 1) % arr.length];
    acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
    return acc;
  }, ["M", ...pts[0], "Q"]);
  return [...d, "Z"].join(" ");
}

function drawSmooth(ctx, rawPts, strokeSize, strokeColor, isErase) {
  const pf = window.__pf__;
  if (!pf || !rawPts.length) return;
  const stroke = pf(rawPts.map((p) => [p.x, p.y, p.pressure ?? 0.5]), {
    size: strokeSize,
    thinning: isErase ? 0 : 0.45,
    smoothing: 0.5,
    streamline: 0.45,
    simulatePressure: !isErase,
    last: true,
  });
  const path = new Path2D(toSvgPath(stroke));
  ctx.save();
  ctx.globalCompositeOperation = isErase ? "destination-out" : "source-over";
  ctx.fillStyle = isErase ? "rgba(0,0,0,1)" : strokeColor;
  ctx.fill(path);
  ctx.restore();
}

function drawTextAnn(ctx, ann) {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.font = `bold ${ann.size}px Arial, sans-serif`;
  ctx.fillStyle = ann.color;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.strokeText(ann.text, ann.x, ann.y);
  ctx.fillText(ann.text, ann.x, ann.y);
  ctx.restore();
}

function repaintStatic(ctx, actions) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  actions.forEach((ann) => {
    if (ann.type === "stroke") drawSmooth(ctx, ann.pts, ann.w, ann.color, false);
    else if (ann.type === "erase") drawSmooth(ctx, ann.pts, ann.w, ann.color, true);
    else if (ann.type === "text") drawTextAnn(ctx, ann);
  });
}

function hex01(hex) {
  const h = hex.replace("#", "");
  return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 };
}

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#000000", "#ffffff"];
const SIZES = [4, 8, 14, 22];

const PageRenderer = memo(function PageRenderer({
  pdfDoc, pageNum, scale, pageAnns, tool, color, penSize, onStroke, onTextRequest, scrollMode,
}) {
  const pdfRef = useRef(null);
  const staticRef = useRef(null);
  const liveRef = useRef(null);
  const downRef = useRef(false);
  const ptsRef = useRef([]);
  const rafRef = useRef(null);
  const renderTaskRef = useRef(null);

  useEffect(() => {
    if (!pdfDoc || !pdfRef.current) return;
    let live = true;
    if (renderTaskRef.current) { try { renderTaskRef.current.cancel(); } catch {} renderTaskRef.current = null; }
    (async () => {
      try {
        const pg = await pdfDoc.getPage(pageNum);
        if (!live || !pdfRef.current) return;
        const dpr = window.devicePixelRatio || 1;
        const vp = pg.getViewport({ scale });
        const W = Math.floor(vp.width);
        const H = Math.floor(vp.height);
        [pdfRef, staticRef, liveRef].forEach((r) => {
          if (!r.current) return;
          r.current.width = Math.floor(W * dpr);
          r.current.height = Math.floor(H * dpr);
          r.current.style.width = `${W}px`;
          r.current.style.height = `${H}px`;
        });
        if (!live || !pdfRef.current) return;
        const ctx = pdfRef.current.getContext("2d");
        const t = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined;
        const task = pg.render({ canvasContext: ctx, viewport: vp, transform: t });
        renderTaskRef.current = task;
        await task.promise;
        renderTaskRef.current = null;
      } catch (e) {
        renderTaskRef.current = null;
        if (e?.name !== "RenderingCancelledException") console.error("[page render]", pageNum, e);
      }
    })();
    return () => { live = false; if (renderTaskRef.current) { try { renderTaskRef.current.cancel(); } catch {} renderTaskRef.current = null; } };
  }, [pdfDoc, pageNum, scale]);

  useEffect(() => {
    const canvas = staticRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    repaintStatic(ctx, pageAnns);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [pageAnns]);

  const getPos = (e) => {
    const rect = liveRef.current.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top, pressure: e.pressure ?? 0.5 };
  };
  const onDown = (e) => { if (tool === "text" || scrollMode) return; e.preventDefault(); downRef.current = true; ptsRef.current = [getPos(e)]; };
  const onMove = (e) => {
    if (!downRef.current || scrollMode) return;
    e.preventDefault();
    ptsRef.current.push(getPos(e));
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const canvas = liveRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawSmooth(ctx, ptsRef.current, tool === "eraser" ? penSize * 3 : penSize, color, tool === "eraser");
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    });
  };
  const onUp = () => {
    if (!downRef.current) return;
    downRef.current = false;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    const pts = ptsRef.current;
    if (!pts.length) return;
    const sCanvas = staticRef.current;
    if (sCanvas) {
      const dpr = window.devicePixelRatio || 1;
      const ctx = sCanvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawSmooth(ctx, pts, tool === "eraser" ? penSize * 3 : penSize, color, tool === "eraser");
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    const lCanvas = liveRef.current;
    if (lCanvas) lCanvas.getContext("2d").clearRect(0, 0, lCanvas.width, lCanvas.height);
    onStroke(pageNum, { type: tool === "eraser" ? "erase" : "stroke", pts: [...pts], color, w: tool === "eraser" ? penSize * 3 : penSize, drawnAtScale: scale });
    ptsRef.current = [];
  };
  const onTap = (e) => {
    if (tool !== "text") return;
    const rect = liveRef.current.getBoundingClientRect();
    onTextRequest(pageNum, { cx: e.clientX - rect.left, cy: e.clientY - rect.top, vx: e.clientX, vy: e.clientY });
  };
  const cursor = scrollMode ? "grab" : tool === "pen" ? "crosshair" : tool === "eraser" ? "cell" : "text";

  return (
    <div className="relative mx-auto shadow-2xl" style={{ display: "table" }}>
      <canvas ref={pdfRef} className="block" />
      <canvas ref={staticRef} className="absolute inset-0" style={{ pointerEvents: "none" }} />
      <canvas ref={liveRef} className="absolute inset-0"
        style={{ cursor, touchAction: scrollMode ? "pan-x pan-y" : "none" }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} onClick={onTap} />
    </div>
  );
});

function AnnotatorCore({ fileUrl, annotatedUrl, answerId, onSaved, onClose }) {
  const wrapRef = useRef(null);
  const pdfjsRef = useRef(null);
  const pdfDocRef = useRef(null);
  const PDFDocRef = useRef(null);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.4);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#ef4444");
  const [penSize, setPenSize] = useState(8);
  const [anns, setAnns] = useState({});
  const [libReady, setLibReady] = useState(false);
  const [docLoaded, setDocLoaded] = useState(false);
  const [libLoading, setLibLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [scrollMode, setScrollMode] = useState(false);
  const [textPopup, setTextPopup] = useState(null);
  const [textVal, setTextVal] = useState("");

  const proxied = (u) => `/api/v1/pdf-proxy?url=${encodeURIComponent(u)}`;

  useEffect(() => {
    let live = true;
    const loadPdfjs = () => new Promise((res, rej) => {
      if (window.pdfjsLib) return res(window.pdfjsLib);
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      s.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        res(window.pdfjsLib);
      };
      s.onerror = () => rej(new Error("pdfjs load failed"));
      document.head.appendChild(s);
    });
    (async () => {
      try {
        const [pdfjs, , { default: getStroke }] = await Promise.all([
          loadPdfjs(), import("pdf-lib"), import("perfect-freehand"),
        ]);
        if (!live) return;
        pdfjsRef.current = pdfjs;
        window.__pf__ = getStroke;
        setLibReady(true);
        setLibLoading(false);
      } catch (e) { console.error("[Annotator] libs failed", e); setLibLoading(false); }
    })();
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (!libReady || !fileUrl) return;
    let live = true;
    (async () => {
      try {
        const doc = await pdfjsRef.current.getDocument({ url: proxied(annotatedUrl || fileUrl) }).promise;
        if (!live) return;
        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setAnns({});
        setDocLoaded(true);
      } catch (e) { console.error("[Annotator] PDF load", e); toast.error("PDF লোড করা যায়নি"); }
    })();
    return () => { live = false; };
  }, [libReady, fileUrl, annotatedUrl]);

  useEffect(() => {
    if (!docLoaded || !pdfDocRef.current || !wrapRef.current) return;
    (async () => {
      try {
        const pg = await pdfDocRef.current.getPage(1);
        const base = pg.getViewport({ scale: 1 });
        const avail = wrapRef.current.clientWidth - 32;
        setScale(() => Math.max(0.5, Math.min(2.5, Math.round((avail / base.width) * 10) / 10)));
      } catch {}
    })();
  }, [docLoaded]);

  const handleStroke = useCallback((pageNum, ann) => {
    setAnns((prev) => ({ ...prev, [pageNum]: [...(prev[pageNum] || []), ann] }));
    setSaved(false);
  }, []);
  const handleTextRequest = useCallback((pageNum, pos) => { setTextPopup({ pageNum, ...pos }); setTextVal(""); }, []);
  const confirmText = () => {
    if (!textPopup || !textVal.trim()) return setTextPopup(null);
    const ann = { type: "text", text: textVal.trim(), x: textPopup.cx, y: textPopup.cy, color, size: Math.max(14, Math.round(16 * scale)), drawnAtScale: scale };
    setAnns((prev) => ({ ...prev, [textPopup.pageNum]: [...(prev[textPopup.pageNum] || []), ann] }));
    setTextPopup(null); setTextVal(""); setSaved(false);
  };
  const undo = useCallback(() => {
    setAnns((prev) => {
      for (let p = numPages; p >= 1; p--) if ((prev[p] || []).length > 0) { setSaved(false); return { ...prev, [p]: prev[p].slice(0, -1) }; }
      return prev;
    });
  }, [numPages]);

  const handleSave = async () => {
    if (!pdfDocRef.current) return;
    setSaving(true);
    try {
      const res = await fetch(proxied(annotatedUrl || fileUrl));
      if (!res.ok) throw new Error("Could not load PDF");
      const pdfBytes = await res.arrayBuffer();
      const { PDFDocument, rgb, LineCapStyle } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pdfPages = pdfDoc.getPages();
      for (let p = 1; p <= numPages; p++) {
        const pageAnns = anns[p] || [];
        if (!pageAnns.length) continue;
        const pdfPage = pdfPages[p - 1];
        const { height: pH } = pdfPage.getSize();
        for (const ann of pageAnns) {
          const s = ann.drawnAtScale || scale;
          if (ann.type === "stroke" || ann.type === "erase") {
            const c = ann.type === "erase" ? rgb(1, 1, 1) : (() => { const { r, g, b } = hex01(ann.color); return rgb(r, g, b); })();
            const thick = Math.max(0.5, ann.w / s);
            const pts = ann.pts;
            if (pts.length === 1) {
              pdfPage.drawCircle({ x: pts[0].x / s, y: pH - pts[0].y / s, size: thick / 2, color: c, borderColor: c, borderWidth: 0 });
            } else {
              for (let i = 0; i < pts.length - 1; i++)
                pdfPage.drawLine({ start: { x: pts[i].x / s, y: pH - pts[i].y / s }, end: { x: pts[i + 1].x / s, y: pH - pts[i + 1].y / s }, thickness: thick, color: c, lineCap: LineCapStyle.Round });
            }
          } else if (ann.type === "text") {
            const { r, g, b } = hex01(ann.color);
            try { pdfPage.drawText(ann.text, { x: ann.x / s, y: pH - ann.y / s, size: Math.max(8, ann.size / s), color: rgb(r, g, b) }); } catch {}
          }
        }
      }
      const savedBytes = await pdfDoc.save();
      const blob = new Blob([savedBytes], { type: "application/pdf" });
      const pr = await fetch(`/api/v1/admin/written-answers/${answerId}/annotate/presign`, { method: "POST" });
      if (!pr.ok) throw new Error("No presign URL");
      const { uploadUrl, publicUrl } = await pr.json();
      const up = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": "application/pdf", "x-upsert": "true" }, body: blob });
      if (!up.ok) throw new Error(`Upload failed ${up.status}`);
      const sr = await fetch(`/api/v1/admin/written-answers/${answerId}/annotate`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: publicUrl }),
      });
      const d = await sr.json();
      if (sr.ok) { setSaved(true); onSaved?.(d.url); toast.success("মার্ক করা PDF সংরক্ষিত হয়েছে"); }
      else throw new Error(d.error);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "সংরক্ষণ ব্যর্থ");
    } finally { setSaving(false); }
  };

  const hasAnns = Object.values(anns).some((a) => a.length > 0);

  return (
    <div className="flex h-full select-none flex-col bg-gray-950">
      <div className="flex shrink-0 flex-wrap items-center gap-2 gap-y-1.5 border-b border-gray-800 bg-gray-900 px-3 py-2">
        <button type="button" onClick={() => setScrollMode((m) => !m)}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${scrollMode ? "border-amber-500 bg-amber-500 text-white" : "border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white"}`}>
          {scrollMode ? <><Hand size={15} /> স্ক্রোল</> : <><Pen size={15} /> ড্র</>}
        </button>
        <div className="h-6 w-px bg-gray-700" />
        {!scrollMode && (
          <div className="flex items-center gap-0.5 rounded-xl bg-gray-800 p-1">
            {[{ id: "pen", Icon: Pen }, { id: "eraser", Icon: Eraser }, { id: "text", Icon: Type }].map(({ id, Icon }) => (
              <button key={id} type="button" onClick={() => setTool(id)}
                className={`rounded-lg p-2.5 transition-all ${tool === id ? "bg-purple-600 text-white" : "text-gray-400 hover:bg-gray-700 hover:text-white"}`}>
                <Icon size={16} />
              </button>
            ))}
          </div>
        )}
        {!scrollMode && (
          <>
            <div className="flex items-center gap-0.5 rounded-xl bg-gray-800 p-1">
              {SIZES.map((s) => (
                <button key={s} type="button" onClick={() => setPenSize(s)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${penSize === s ? "bg-purple-600" : "hover:bg-gray-700"}`}>
                  <span className="rounded-full bg-white" style={{ width: Math.min(s, 14), height: Math.min(s, 14), opacity: penSize === s ? 1 : 0.5 }} />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-gray-800 px-2 py-1.5">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`h-5 w-5 rounded-full transition-transform ${color === c ? "scale-125 ring-2 ring-purple-400 ring-offset-1 ring-offset-gray-800" : "hover:scale-110"}`}
                  style={{ backgroundColor: c, border: c === "#ffffff" ? "1px solid #555" : "none" }} />
              ))}
            </div>
          </>
        )}
        <div className="h-6 w-px bg-gray-700" />
        <button type="button" onClick={undo} className="rounded-xl p-2.5 text-gray-400 transition-all hover:bg-gray-800 hover:text-white"><Undo2 size={16} /></button>
        <div className="flex items-center gap-0.5 rounded-xl bg-gray-800 px-1 py-1">
          <button type="button" onClick={() => setScale((s) => Math.max(0.4, Math.round((s - 0.2) * 10) / 10))} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-700 hover:text-white"><ZoomOut size={14} /></button>
          <span className="w-10 text-center text-xs tabular-nums text-gray-300">{Math.round(scale * 100)}%</span>
          <button type="button" onClick={() => setScale((s) => Math.min(3.5, Math.round((s + 0.2) * 10) / 10))} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-700 hover:text-white"><ZoomIn size={14} /></button>
        </div>
        <div className="flex-1" />
        <button type="button" onClick={handleSave} disabled={saving || !libReady || !hasAnns}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${saved ? "bg-green-600 text-white" : "bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40"}`}>
          {saving ? <><Loader2 size={14} className="animate-spin" /> সংরক্ষণ...</> : saved ? <><CheckCircle2 size={14} /> সংরক্ষিত</> : <><Save size={14} /> PDF সংরক্ষণ</>}
        </button>
        <button type="button" onClick={onClose} className="rounded-xl p-2.5 text-gray-400 transition-all hover:bg-red-600/20 hover:text-white"><X size={18} /></button>
      </div>

      <div ref={wrapRef} className="flex-1 overflow-auto bg-gray-900 py-4" style={{ WebkitOverflowScrolling: "touch" }}>
        {(libLoading || (!docLoaded && libReady)) && (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <Loader2 size={36} className="animate-spin text-purple-400" />
            <p className="text-sm text-gray-400">PDF লোড হচ্ছে...</p>
          </div>
        )}
        {docLoaded && Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
          <div key={pageNum} className="mb-3 flex justify-center">
            <PageRenderer pdfDoc={pdfDocRef.current} pageNum={pageNum} scale={scale} pageAnns={anns[pageNum] || []}
              tool={tool} color={color} penSize={penSize} onStroke={handleStroke} onTextRequest={handleTextRequest} scrollMode={scrollMode} />
          </div>
        ))}
      </div>

      {textPopup && (
        <div className="fixed z-[99999] min-w-52 rounded-xl border border-purple-300 bg-white p-2 shadow-2xl"
          style={{ left: Math.min(textPopup.vx, window.innerWidth - 220), top: textPopup.vy }}>
          <input autoFocus type="text" value={textVal} onChange={(e) => setTextVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") confirmText(); if (e.key === "Escape") setTextPopup(null); }}
            placeholder="টেক্সট লিখুন..." className="mb-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" style={{ color }} />
          <div className="flex gap-1.5">
            <button type="button" onClick={confirmText} className="flex-1 rounded-lg bg-purple-600 py-1.5 text-xs font-medium text-white hover:bg-purple-700">যোগ করুন</button>
            <button type="button" onClick={() => setTextPopup(null)} className="flex-1 rounded-lg bg-gray-100 py-1.5 text-xs text-gray-700 hover:bg-gray-200">বাতিল</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PdfAnnotator({ fileUrl, annotatedUrl, answerId, onSaved, onClose }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  if (!mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col" style={{ background: "#030712" }}>
      <AnnotatorCore fileUrl={fileUrl} annotatedUrl={annotatedUrl} answerId={answerId} onSaved={onSaved} onClose={onClose} />
    </div>,
    document.body
  );
}
