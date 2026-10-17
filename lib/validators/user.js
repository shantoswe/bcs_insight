import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(1).max(120),
  nameBn: z.string().trim().max(120).nullish(),
  phone: z.string().trim().max(20).nullish(),
  targetExam: z.string().trim().max(120).nullish(),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "নাম দিন (name required)").max(120),
  email: z.string().trim().email("সঠিক ইমেইল দিন (valid email required)"),
  password: z.string().min(8, "কমপক্ষে ৮ অক্ষরের পাসওয়ার্ড (min 8 characters)").max(72),
  phone: z.string().trim().max(20).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const setRoleSchema = z.object({
  role: z.enum(["ADMIN", "MODERATOR", "STUDENT"]),
  permissions: z.array(z.string()).default([]),
});

export const banSchema = z.object({
  isBanned: z.boolean(),
  banReason: z.string().max(500).nullish(),
});
