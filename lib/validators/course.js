import { z } from "zod";

export const courseSchema = z.object({
  slug: z.string().trim().max(80).optional(),
  courseType: z.enum(["PRELIMINARY", "WRITTEN", "EXAM", "GENERAL"]).default("GENERAL"),
  titleEn: z.string().trim().min(1).max(200),
  titleBn: z.string().trim().max(200).nullish(),
  descriptionEn: z.string().trim().max(4000).nullish(),
  descriptionBn: z.string().trim().max(4000).nullish(),
  thumbnailPath: z.string().trim().max(1000).nullish(),
  categoryId: z.string().nullish(),
  priceBDT: z.coerce.number().min(0).default(0),
  isFree: z.boolean().default(false),
  isPublished: z.boolean().default(false),
});

export const sectionSchema = z.object({
  courseId: z.string().min(1),
  titleEn: z.string().trim().min(1).max(200),
  titleBn: z.string().trim().max(200).nullish(),
  order: z.coerce.number().int().default(0),
});

export const lessonSchema = z.object({
  sectionId: z.string().min(1),
  type: z.enum(["VIDEO", "PDF", "LIVE_CLASS", "QUIZ", "RESOURCE", "EXAM"]).default("VIDEO"),
  titleEn: z.string().trim().min(1).max(200),
  titleBn: z.string().trim().max(200).nullish(),
  order: z.coerce.number().int().default(0),
  bunnyVideoId: z.string().trim().max(100).nullish(),
  videoStatus: z.enum(["NONE", "CREATED", "UPLOADING", "PROCESSING", "READY", "FAILED"]).optional(),
  durationSeconds: z.coerce.number().int().min(0).nullish(),
  linkUrl: z.string().trim().max(1000).nullish(),
  examId: z.string().nullish(),
  liveScheduledAt: z.string().nullish(),
  filePath: z.string().trim().max(500).nullish(),
  isFreePreview: z.boolean().default(false),
  isPublished: z.boolean().default(true),
});

export const lessonUpdateSchema = lessonSchema.partial().omit({ sectionId: true });
