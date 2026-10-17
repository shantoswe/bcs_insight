import { z } from "zod";

export const categorySchema = z.object({
  slug: z.string().trim().max(60).optional(),
  nameEn: z.string().trim().min(1).max(120),
  nameBn: z.string().trim().min(1).max(120),
  icon: z.string().trim().max(8).optional(),
  order: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const subjectSchema = z.object({
  categoryId: z.string().min(1),
  slug: z.string().trim().max(60).optional(),
  nameEn: z.string().trim().min(1).max(120),
  nameBn: z.string().trim().min(1).max(120),
  order: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const topicSchema = z.object({
  subjectId: z.string().min(1),
  parentId: z.string().min(1).nullish(),
  slug: z.string().trim().max(60).optional(),
  nameEn: z.string().trim().min(1).max(120),
  nameBn: z.string().trim().min(1).max(120),
  order: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
});
