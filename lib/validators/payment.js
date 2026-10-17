import { z } from "zod";

// Student submits a manual mobile-banking payment for a course.
export const paymentRequestSchema = z.object({
  method: z.enum(["BKASH", "NAGAD", "ROCKET", "UPAY", "OTHER"]),
  senderNumber: z.string().trim().max(20).nullish(),
  trxLast4: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{4,}$/, "ট্রানজেকশনের শেষ ৪ সংখ্যা/অক্ষর দিন")
    .max(30),
  trxId: z.string().trim().max(60).nullish(),
  amount: z.coerce.number().min(0),
});

// Admin approves or rejects.
export const paymentReviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  adminNote: z.string().trim().max(1000).nullish(),
});
