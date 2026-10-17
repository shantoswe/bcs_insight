import { z } from "zod";

export const optionSchema = z
  .object({
    textBn: z.string().trim().max(2000).default(""),
    textEn: z.string().trim().max(2000).nullish(),
    imagePath: z.string().trim().max(1000).nullish(), // image URL (optional)
    isCorrect: z.boolean().default(false),
  })
  .refine((o) => o.textBn.length > 0 || !!o.imagePath, {
    message: "অপশনে টেক্সট বা ছবি দিন (option needs text or image)",
    path: ["textBn"],
  });

const questionFields = {
  subjectId: z.string().min(1, "বিষয় নির্বাচন করুন (subject required)"),
  topicId: z.string().min(1).nullish(),
  textBn: z.string().trim().max(5000).default(""), // may be empty when an image carries the question
  textEn: z.string().trim().max(5000).nullish(),
  imagePath: z.string().trim().max(1000).nullish(), // question image URL (optional)
  explanationBn: z.string().trim().max(10000).nullish(),
  explanationEn: z.string().trim().max(10000).nullish(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  source: z.string().trim().max(100).nullish(),
  year: z.coerce.number().int().min(1970).max(2100).nullish(),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]).default("ACTIVE"),
  options: z
    .array(optionSchema)
    .min(2, "কমপক্ষে ২টি অপশন (at least 2 options)")
    .max(5, "সর্বোচ্চ ৫টি অপশন (max 5 options)"),
};

const oneCorrect = (d, ctx) => {
  if (d.options && d.options.filter((o) => o.isCorrect).length !== 1)
    ctx.addIssue({
      code: "custom",
      path: ["options"],
      message: "ঠিক একটি সঠিক উত্তর নির্বাচন করুন (exactly one correct option)",
    });
  if ("textBn" in d && !d.textBn && !d.imagePath)
    ctx.addIssue({ code: "custom", path: ["textBn"], message: "প্রশ্নে টেক্সট বা ছবি দিন (question needs text or image)" });
};

export const questionSchema = z.object(questionFields).superRefine(oneCorrect);
export const questionUpdateSchema = z.object(questionFields).superRefine(oneCorrect);

// ---- Bulk import (single row) ----
const trimmed = z
  .any()
  .transform((v) => (v ?? "").toString().trim());

const requiredText = (label) =>
  trimmed.refine((v) => v.length > 0, { message: `${label} is required / খালি রাখা যাবে না` });

export const importRowSchema = z
  .object({
    subject: requiredText("subject"),
    topic: trimmed,
    difficulty: trimmed.refine((v) => ["", "easy", "medium", "hard"].includes(v.toLowerCase()), {
      message: 'difficulty must be "easy", "medium" or "hard" (or empty for medium)',
    }),
    source: trimmed,
    year: trimmed.refine((v) => v === "" || (/^\d{4}$/.test(v) && +v >= 1970 && +v <= 2100), {
      message: "year must be a 4-digit year 1970–2100 (or empty)",
    }),
    question: requiredText("question"),
    option_a: requiredText("option_a"),
    option_b: requiredText("option_b"),
    option_c: requiredText("option_c"),
    option_d: requiredText("option_d"),
    option_e: trimmed,
    correct: trimmed.refine((v) => /^[a-e1-5]$/i.test(v), {
      message: "correct must be A–E (or 1–5)",
    }),
    explanation: trimmed,
  })
  .superRefine((r, ctx) => {
    const idx = /^[1-5]$/.test(r.correct)
      ? +r.correct - 1
      : r.correct.toLowerCase().charCodeAt(0) - 97;
    if (idx === 4 && !r.option_e)
      ctx.addIssue({ code: "custom", path: ["correct"], message: "correct is E but option_e is empty" });
  })
  .transform((r) => {
    const options = [r.option_a, r.option_b, r.option_c, r.option_d, ...(r.option_e ? [r.option_e] : [])];
    return {
      ...r,
      options,
      difficulty: (r.difficulty || "medium").toUpperCase(),
      year: r.year ? +r.year : null,
      correctIndex: /^[1-5]$/.test(r.correct)
        ? +r.correct - 1
        : r.correct.toLowerCase().charCodeAt(0) - 97,
    };
  });

export const IMPORT_HEADERS = [
  "subject", "topic", "difficulty", "source", "year",
  "question",
  "option_a", "option_b", "option_c", "option_d", "option_e",
  "correct", "explanation",
];
