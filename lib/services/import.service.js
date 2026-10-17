import Papa from "papaparse";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api/errors";
import { computeContentHash } from "@/lib/services/content-hash";
import { createQuestion } from "@/lib/services/question.service";

const MAX_ROWS = 1000;
const DIFF = { easy: "EASY", medium: "MEDIUM", hard: "HARD" };

// ---- parsing raw input into plain row objects ----

function normKeys(row) {
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [String(k).trim().toLowerCase(), v]));
}

function parseCsv(text) {
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const delimiter = clean.split("\n")[0].includes("\t") ? "\t" : ",";
  const { data } = Papa.parse(clean, {
    header: true,
    delimiter,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().toLowerCase(),
  });
  return data.map(normKeys);
}

function parseXlsx(base64) {
  let wb;
  try {
    wb = XLSX.read(base64, { type: "base64" });
  } catch {
    throw new ApiError("Could not read the Excel file", 400);
  }
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) throw new ApiError("Excel file has no sheets", 400);
  return XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false }).map(normKeys);
}

function parseJsonText(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new ApiError("JSON সঠিক নয় (invalid JSON): " + e.message, 400);
  }
  if (!Array.isArray(data)) {
    if (Array.isArray(data?.questions)) data = data.questions;
    else throw new ApiError("JSON একটি অ্যারে (array of questions) হতে হবে", 400);
  }
  return data;
}

// ---- row → editable question object ----

const letterToIdx = (c) => c.toUpperCase().charCodeAt(0) - 65;

function fromFlatRow(raw) {
  // CSV / Excel / paste: columns subject, topic, difficulty, source, year,
  // question, image, option_a..e (+ *_img), correct, explanation
  const g = (k) => (raw[k] ?? "").toString().trim();
  const opts = [];
  for (const L of ["a", "b", "c", "d", "e"]) {
    const t = g(`option_${L}`);
    const img = g(`option_${L}_img`) || g(`option_${L}_image`);
    if (t || img) opts.push({ textBn: t, imagePath: img || null, isCorrect: false });
  }
  const correct = g("correct");
  let correctIndex = -1;
  if (/^[1-5]$/.test(correct)) correctIndex = +correct - 1;
  else if (/^[a-eA-E]$/.test(correct)) correctIndex = letterToIdx(correct);
  if (correctIndex >= 0 && correctIndex < opts.length) opts[correctIndex].isCorrect = true;

  return {
    subjectName: g("subject"),
    topicName: g("topic"),
    textBn: g("question"),
    imagePath: g("image") || g("image_url") || null,
    difficulty: DIFF[g("difficulty").toLowerCase()] || "MEDIUM",
    source: g("source") || null,
    year: /^\d{4}$/.test(g("year")) ? +g("year") : null,
    explanationBn: g("explanation") || null,
    options: opts,
  };
}

function fromJsonRow(obj) {
  // JSON: { subject, topic?, difficulty?, source?, year?, question, image?,
  //         options: ["a", {text,image,correct}, ...], correct?, explanation? }
  const opts = [];
  let correctIndex = -1;
  (obj.options || []).forEach((o, i) => {
    if (typeof o === "string") opts.push({ textBn: o.trim(), imagePath: null, isCorrect: false });
    else {
      opts.push({
        textBn: (o.text ?? o.textBn ?? "").toString().trim(),
        imagePath: o.image ?? o.img ?? o.imagePath ?? null,
        isCorrect: !!(o.correct ?? o.isCorrect),
      });
      if (o.correct === true || o.isCorrect === true) correctIndex = i;
    }
  });
  if (obj.correct != null) {
    const c = String(obj.correct).trim();
    if (/^[0-9]+$/.test(c)) correctIndex = +c; // 0-based index
    else if (/^[a-eA-E]$/.test(c)) correctIndex = letterToIdx(c);
  }
  opts.forEach((o, i) => (o.isCorrect = i === correctIndex));

  const diff = (obj.difficulty ?? "").toString().toLowerCase();
  return {
    subjectName: (obj.subject ?? "").toString().trim(),
    topicName: (obj.topic ?? "").toString().trim(),
    textBn: (obj.question ?? obj.textBn ?? "").toString().trim(),
    imagePath: obj.image ?? obj.imageUrl ?? obj.imagePath ?? null,
    difficulty: DIFF[diff] || "MEDIUM",
    source: obj.source ?? null,
    year: obj.year ? parseInt(obj.year, 10) : null,
    explanationBn: obj.explanation ?? obj.explanationBn ?? null,
    options: opts,
  };
}

// ---- parse → editable preview ----

export async function parseToEditable({ format, text, base64 }) {
  let rows;
  if (format === "csv" || format === "paste") rows = parseCsv(text);
  else if (format === "xlsx") rows = parseXlsx(base64);
  else if (format === "json" || format === "json-text") rows = parseJsonText(text);
  else throw new ApiError("Unsupported format", 400);

  if (!rows || rows.length === 0) throw new ApiError("কোনো প্রশ্ন পাওয়া যায়নি (no rows found)", 400);
  if (rows.length > MAX_ROWS) throw new ApiError(`সর্বোচ্চ ${MAX_ROWS}টি প্রশ্ন (max ${MAX_ROWS})`, 400);

  // subject lookup: slug or English name (case-insensitive)
  const subjects = await prisma.subject.findMany({ include: { topics: true } });
  const subjectMap = new Map();
  for (const s of subjects) {
    subjectMap.set(s.slug.toLowerCase(), s);
    subjectMap.set(s.nameEn.toLowerCase(), s);
    subjectMap.set(s.nameBn.toLowerCase(), s);
  }

  const isJson = format === "json" || format === "json-text";
  const items = rows.map((raw, idx) => {
    const q = isJson ? fromJsonRow(raw) : fromFlatRow(normKeys(raw));
    const subject = q.subjectName ? subjectMap.get(q.subjectName.toLowerCase()) : null;
    const topic = subject && q.topicName
      ? subject.topics.find((t) => [t.slug, t.nameEn, t.nameBn].some((x) => x.toLowerCase() === q.topicName.toLowerCase()))
      : null;

    const errors = [];
    if (!q.textBn && !q.imagePath) errors.push("প্রশ্নে টেক্সট বা ছবি দিন");
    const filledOpts = q.options.filter((o) => o.textBn || o.imagePath);
    if (filledOpts.length < 2) errors.push("কমপক্ষে ২টি অপশন দিন");
    if (filledOpts.length > 5) errors.push("সর্বোচ্চ ৫টি অপশন");
    if (q.options.filter((o) => o.isCorrect).length !== 1) errors.push("সঠিক উত্তর নির্বাচন করুন");
    if (!subject) errors.push(`বিষয় পাওয়া যায়নি: "${q.subjectName}" — এডিটরে নির্বাচন করুন`);

    const contentHash = computeContentHash(q.textBn, q.options.map((o) => o.textBn));

    return {
      idx,
      errors,
      duplicate: false, // filled below
      question: {
        subjectId: subject?.id || "",
        subjectName: q.subjectName,
        topicId: topic?.id || null,
        textBn: q.textBn,
        imagePath: q.imagePath,
        difficulty: q.difficulty,
        source: q.source,
        year: q.year,
        explanationBn: q.explanationBn,
        options: q.options,
        contentHash,
      },
    };
  });

  // DB duplicate flags
  const hashes = items.map((i) => i.question.contentHash);
  const existing = hashes.length
    ? await prisma.question.findMany({ where: { contentHash: { in: hashes } }, select: { contentHash: true } })
    : [];
  const dbHashes = new Set(existing.map((e) => e.contentHash));
  // in-file dup
  const seen = new Set();
  for (const it of items) {
    const h = it.question.contentHash;
    if (dbHashes.has(h) || seen.has(h)) it.duplicate = true;
    seen.add(h);
  }

  return {
    items,
    total: items.length,
    validCount: items.filter((i) => i.errors.length === 0 && !i.duplicate).length,
  };
}

// ---- save edited questions ----

export async function saveEditedQuestions(questions, adminId, { examId = null } = {}) {
  let created = 0;
  let skipped = 0;
  const createdIds = [];

  for (const q of questions ?? []) {
    const filled = (q.options ?? []).filter((o) => (o.textBn && o.textBn.trim()) || o.imagePath);
    const hasCorrect = filled.filter((o) => o.isCorrect).length === 1;
    if (!q.subjectId || (!q.textBn?.trim() && !q.imagePath) || filled.length < 2 || !hasCorrect) {
      skipped++;
      continue;
    }
    try {
      const row = await createQuestion(
        {
          subjectId: q.subjectId,
          topicId: q.topicId || null,
          textBn: (q.textBn || "").trim(),
          imagePath: q.imagePath || null,
          explanationBn: q.explanationBn || null,
          difficulty: q.difficulty || "MEDIUM",
          source: q.source || null,
          year: q.year || null,
          options: filled.map((o) => ({
            textBn: (o.textBn || "").trim(),
            imagePath: o.imagePath || null,
            isCorrect: !!o.isCorrect,
          })),
        },
        adminId
      );
      createdIds.push(row.id);
      created++;
    } catch (e) {
      if (e?.status === 409) skipped++; // duplicate
      else throw e;
    }
  }

  let attached = 0;
  if (examId && createdIds.length > 0) {
    const { appendExamQuestions } = await import("@/lib/services/exam.service");
    attached = await appendExamQuestions(examId, createdIds);
  }

  return { created, skipped, attached };
}

// ---- templates ----

export function csvTemplate() {
  const headers = [
    "subject", "topic", "difficulty", "source", "year",
    "question", "image",
    "option_a", "option_b", "option_c", "option_d", "option_e",
    "correct", "explanation",
  ];
  const example = [
    "bangla", "grammar", "medium", "35th BCS", "2015",
    "'অহংকার' শব্দের বিপরীত শব্দ কোনটি?", "",
    "বিনয়", "দম্ভ", "গর্ব", "আত্মম্ভরিতা", "",
    "A", "'অহংকার' এর বিপরীত শব্দ 'বিনয়'।",
  ];
  return "﻿" + [headers.join(","), example.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")].join("\n");
}

export function jsonTemplate() {
  return JSON.stringify(
    [
      {
        subject: "math",
        topic: "",
        difficulty: "medium",
        source: "",
        year: 2023,
        question: "যদি $x^2 = 16$ হয়, তবে $x$ এর মান কত?",
        options: ["4 বা -4", "শুধু 4", "শুধু -4", "8"],
        correct: 0,
        explanation: "$x^2=16 \\Rightarrow x=\\pm 4$",
      },
      {
        subject: "chemistry",
        question: "পানির সংকেত কোনটি? (H বিষয়ক)",
        options: [{ text: "H₂O" }, { text: "CO₂" }, { text: "O₂" }, { text: "H₂" }],
        correct: 0,
      },
    ],
    null,
    2
  );
}
