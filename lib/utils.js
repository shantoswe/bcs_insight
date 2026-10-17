import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// slugify for taxonomy / courses
export function slugify(text) {
  return (text ?? "")
    .toString()
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[^\wঀ-৿\s-]/g, "") // keep Bengala unicode range
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
export function toBn(n) {
  return String(n).split("").map((d) => BN_DIGITS[+d] ?? d).join("");
}

// Positional Bengali option labels (ক খ গ ঘ ঙ), falling back to A–E.
export const BN_OPTION_LABELS = ["ক", "খ", "গ", "ঘ", "ঙ", "চ"];

export function formatBDT(n) {
  const v = Number(n) || 0;
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(v);
}

export function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

// mm:ss countdown label
export function clock(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  const pad = (x) => String(x).padStart(2, "0");
  return hh > 0 ? `${pad(hh)}:${pad(mm)}:${pad(sec)}` : `${pad(mm)}:${pad(sec)}`;
}

export function formatDateTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
