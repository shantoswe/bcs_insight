import { z } from "zod";

export const examSchema = z.object({
  type: z.enum(["PRACTICE", "LIVE"]),
  categoryId: z.string().nullish(),
  courseId: z.string().nullish(),
  titleEn: z.string().trim().min(1).max(200),
  titleBn: z.string().trim().max(200).nullish(),
  descriptionBn: z.string().trim().max(2000).nullish(),
  durationMinutes: z.coerce.number().int().min(1).max(600),
  passMark: z.coerce.number().min(0).default(0),
  negativeMarking: z.coerce.number().min(0).max(5).default(0.25),
  shuffleQuestions: z.boolean().default(true),
  shuffleOptions: z.boolean().default(true),
  startAt: z.string().nullish(),
  endAt: z.string().nullish(),
  instantResult: z.boolean().default(false),
  autoPublishResults: z.boolean().default(true),
});

export const examUpdateSchema = examSchema.partial();
