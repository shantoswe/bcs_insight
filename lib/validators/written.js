import { z } from "zod";

export const writtenExamSchema = z.object({
  titleEn: z.string().trim().min(1).max(200),
  titleBn: z.string().trim().max(200).nullish(),
  descriptionBn: z.string().trim().max(2000).nullish(),
  categoryId: z.string().nullish(),
  durationMinutes: z.coerce.number().int().min(1).max(600),
  uploadWindowMinutes: z.coerce.number().int().min(1).max(120).default(10),
  startAt: z.string().nullish(),
  endAt: z.string().nullish(),
  showModelAnswer: z.boolean().default(true),
});

export const writtenQuestionsSchema = z.object({
  questions: z
    .array(
      z.object({
        promptBn: z.string().trim().min(1).max(5000),
        promptEn: z.string().trim().max(5000).nullish(),
        modelAnswerBn: z.string().trim().max(20000).nullish(),
        modelAnswerEn: z.string().trim().max(20000).nullish(),
        marks: z.coerce.number().min(0).max(100),
      })
    )
    .min(1),
});

export const writtenSubmitSchema = z.object({
  answers: z.array(
    z.object({
      writtenQuestionId: z.string().min(1),
      answerText: z.string().max(50000).nullish(),
      fileUrl: z.string().url().max(1000).nullish(),
    })
  ),
});

export const evaluateSchema = z.object({
  feedback: z.string().max(5000).nullish(),
  marks: z.array(
    z.object({
      answerId: z.string().min(1),
      marksAwarded: z.coerce.number().min(0).max(100),
      evaluatorNote: z.string().max(2000).nullish(),
      voiceUrl: z.string().url().max(1000).nullish(),
    })
  ),
});
