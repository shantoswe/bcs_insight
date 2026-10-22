// Idempotent seed: Supabase auth users + demo taxonomy, questions, exams,
// a written exam and a free course. Safe to re-run.
//
//   npm run db:seed   (node --env-file=.env prisma/seed.js)

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import crypto from "crypto";

const prisma = new PrismaClient();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    // Node < 22 has no global WebSocket; realtime is unused but constructed eagerly.
    realtime: { transport: ws },
  }
);

function contentHash(textBn, optionTextsBn) {
  const norm = (s) => (s ?? "").normalize("NFC").replace(/\s+/g, " ").trim();
  return crypto
    .createHash("sha256")
    .update([norm(textBn), ...optionTextsBn.map(norm)].join("|"), "utf8")
    .digest("hex");
}

// Create (or fetch) a Supabase auth user and mirror it into our User table.
async function ensureUser({ email, password, name, role }) {
  let authId;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
    app_metadata: { role },
  });
  if (error) {
    if (!/already/i.test(error.message)) throw error;
    // already exists — look it up by listing (small dataset in seed)
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    authId = list.users.find((u) => u.email === email)?.id;
    if (!authId) throw new Error(`Could not resolve existing auth user ${email}`);
    await supabase.auth.admin.updateUserById(authId, { app_metadata: { role } });
  } else {
    authId = data.user.id;
  }

  await prisma.user.upsert({
    where: { id: authId },
    update: { role, name },
    create: { id: authId, email, name, role },
  });
  return authId;
}

async function main() {
  console.log("→ Seeding auth users…");
  const adminId = await ensureUser({
    email: "mdsaklinekabir8@gmail.com",
    password: "S@kline66",
    name: "MD Saklian",
    role: "ADMIN",
  });
  for (let i = 1; i <= 3; i++) {
    await ensureUser({
      email: `student${i}@bcsinsight.test`,
      password: "Password123!",
      name: `Student ${i}`,
      role: "STUDENT",
    });
  }

  console.log("→ Seeding taxonomy…");
  const bcs = await prisma.jobCategory.upsert({
    where: { slug: "bcs" },
    update: {},
    create: { slug: "bcs", nameEn: "BCS", nameBn: "বিসিএস", icon: "🎯", order: 0 },
  });

  const subjectData = [
    { slug: "bangla", nameEn: "Bangla", nameBn: "বাংলা" },
    { slug: "english", nameEn: "English", nameBn: "ইংরেজি" },
    { slug: "math", nameEn: "Mathematics", nameBn: "গণিত" },
    { slug: "gk", nameEn: "General Knowledge", nameBn: "সাধারণ জ্ঞান" },
  ];
  const subjects = {};
  for (const [i, s] of subjectData.entries()) {
    subjects[s.slug] = await prisma.subject.upsert({
      where: { categoryId_slug: { categoryId: bcs.id, slug: s.slug } },
      update: {},
      create: { categoryId: bcs.id, order: i, ...s },
    });
  }

  console.log("→ Seeding questions…");
  const questions = [
    { subject: "bangla", textBn: "'অহংকার' শব্দের বিপরীত শব্দ কোনটি?", options: ["বিনয়", "দম্ভ", "গর্ব", "আত্মম্ভরিতা"], correct: 0, explanationBn: "'অহংকার' এর বিপরীত শব্দ 'বিনয়'।" },
    { subject: "bangla", textBn: "'সন্ধি' ব্যাকরণের কোন অংশে আলোচিত হয়?", options: ["ধ্বনিতত্ত্ব", "রূপতত্ত্ব", "বাক্যতত্ত্ব", "অর্থতত্ত্ব"], correct: 0, explanationBn: "সন্ধি ধ্বনিতত্ত্বে আলোচিত হয়।" },
    { subject: "bangla", textBn: "কোনটি শুদ্ধ বানান?", options: ["মুমূর্ষু", "মুমুর্ষু", "মূমুর্ষূ", "মুমূর্ষূ"], correct: 0, explanationBn: "শুদ্ধ বানান 'মুমূর্ষু'।" },
    { subject: "english", textBn: "Choose the correct synonym of 'Benevolent'.", options: ["Kind", "Cruel", "Rich", "Angry"], correct: 0, explanationBn: "Benevolent means kind/generous." },
    { subject: "english", textBn: "The plural of 'Datum' is —", options: ["Data", "Datums", "Datas", "Datae"], correct: 0, explanationBn: "'Data' is the plural of 'Datum'." },
    { subject: "english", textBn: "'A bolt from the blue' means —", options: ["A sudden shock", "A blue sky", "A thunderstorm", "A gift"], correct: 0, explanationBn: "It means a sudden, unexpected event." },
    { subject: "math", textBn: "১ থেকে ১০০ পর্যন্ত সংখ্যাগুলোর যোগফল কত?", options: ["5050", "5000", "5100", "4950"], correct: 0, explanationBn: "n(n+1)/2 = 100×101/2 = 5050।" },
    { subject: "math", textBn: "একটি সংখ্যার ২৫% যদি ৫০ হয়, সংখ্যাটি কত?", options: ["200", "150", "100", "250"], correct: 0, explanationBn: "50 ÷ 0.25 = 200।" },
    { subject: "math", textBn: "৩, ৬, ১১, ১৮, ? — পরবর্তী সংখ্যা কত?", options: ["27", "24", "29", "25"], correct: 0, explanationBn: "পার্থক্য 3,5,7,9 → 18+9=27।" },
    { subject: "gk", textBn: "বাংলাদেশের সংবিধান কার্যকর হয় কোন সালে?", options: ["১৯৭২", "১৯৭১", "১৯৭৩", "১৯৭৪"], correct: 0, explanationBn: "১৬ ডিসেম্বর ১৯৭২ সালে সংবিধান কার্যকর হয়।" },
    { subject: "gk", textBn: "জাতিসংঘের সদর দপ্তর কোথায় অবস্থিত?", options: ["নিউইয়র্ক", "জেনেভা", "প্যারিস", "লন্ডন"], correct: 0, explanationBn: "জাতিসংঘের সদর দপ্তর নিউইয়র্কে।" },
    { subject: "gk", textBn: "'পদ্মা সেতু'র দৈর্ঘ্য কত কিলোমিটার?", options: ["৬.১৫", "৫.৫", "৭.০", "৪.৮"], correct: 0, explanationBn: "পদ্মা সেতুর দৈর্ঘ্য ৬.১৫ কিমি।" },
  ];

  const createdQ = [];
  for (const q of questions) {
    const hash = contentHash(q.textBn, q.options);
    const existing = await prisma.question.findUnique({ where: { contentHash: hash }, select: { id: true } });
    if (existing) { createdQ.push(existing.id); continue; }
    const created = await prisma.question.create({
      data: {
        subjectId: subjects[q.subject].id,
        textBn: q.textBn,
        explanationBn: q.explanationBn,
        difficulty: "MEDIUM",
        contentHash: hash,
        createdById: adminId,
        options: { create: q.options.map((t, i) => ({ order: i, textBn: t, isCorrect: i === q.correct })) },
      },
    });
    createdQ.push(created.id);
  }

  console.log("→ Seeding a practice exam…");
  let exam = await prisma.exam.findFirst({ where: { titleEn: "BCS Model Test — General" } });
  if (!exam) {
    exam = await prisma.exam.create({
      data: {
        type: "PRACTICE",
        status: "PUBLISHED",
        categoryId: bcs.id,
        titleEn: "BCS Model Test — General",
        titleBn: "বিসিএস মডেল টেস্ট — সাধারণ",
        descriptionBn: "সব বিষয়ের মিশ্র প্রশ্ন নিয়ে একটি প্র্যাকটিস টেস্ট।",
        durationMinutes: 20,
        passMark: 6,
        negativeMarking: 0.25,
        totalMarks: createdQ.length,
        instantResult: true,
        createdById: adminId,
        questions: { create: createdQ.map((qid, i) => ({ questionId: qid, order: i, marks: 1 })) },
      },
    });
  }

  console.log("→ Seeding a written exam…");
  let written = await prisma.writtenExam.findFirst({ where: { titleEn: "Written Practice — Essay" } });
  if (!written) {
    written = await prisma.writtenExam.create({
      data: {
        titleEn: "Written Practice — Essay",
        titleBn: "লিখিত অনুশীলন — রচনা",
        descriptionBn: "দুটি বড় প্রশ্নের উত্তর লিখুন।",
        categoryId: bcs.id,
        durationMinutes: 45,
        totalMarks: 20,
        status: "PUBLISHED",
        showModelAnswer: true,
        questions: {
          create: [
            { order: 0, promptBn: "ডিজিটাল বাংলাদেশ বিনির্মাণে তরুণ সমাজের ভূমিকা — আলোচনা করুন।", modelAnswerBn: "ভূমিকা, তরুণদের অবদান (প্রযুক্তি, উদ্যোক্তা, শিক্ষা), চ্যালেঞ্জ ও উপসংহার — ধারাবাহিকভাবে লিখুন।", marks: 10 },
            { order: 1, promptBn: "জলবায়ু পরিবর্তনে বাংলাদেশের ঝুঁকি ও করণীয় ব্যাখ্যা করুন।", modelAnswerBn: "ঝুঁকি (বন্যা, লবণাক্ততা, ঘূর্ণিঝড়), অভিযোজন ও প্রশমন কৌশল উল্লেখ করুন।", marks: 10 },
          ],
        },
      },
    });
  }

  console.log("→ Seeding a free course…");
  let course = await prisma.course.findUnique({ where: { slug: "bcs-preliminary-crash" } });
  if (!course) {
    course = await prisma.course.create({
      data: {
        slug: "bcs-preliminary-crash",
        titleEn: "BCS Preliminary Crash Course",
        titleBn: "বিসিএস প্রিলিমিনারি ক্র্যাশ কোর্স",
        descriptionBn: "প্রিলিমিনারির জন্য দ্রুত প্রস্তুতির ভিডিও কোর্স।",
        categoryId: bcs.id,
        isFree: true,
        isPublished: true,
        sections: {
          create: [
            {
              titleEn: "Getting Started", titleBn: "শুরু করা", order: 0,
              lessons: {
                create: [
                  { type: "VIDEO", titleEn: "Course Introduction", titleBn: "কোর্স পরিচিতি", order: 0, isFreePreview: true, videoStatus: "NONE" },
                  { type: "RESOURCE", titleEn: "Syllabus PDF", titleBn: "সিলেবাস", order: 1, linkUrl: "https://bpsc.gov.bd" },
                ],
              },
            },
          ],
        },
      },
    });
  }

  console.log("→ Seeding site settings…");
  await prisma.siteSetting.upsert({
    where: { key: "siteName" },
    update: {},
    create: { key: "siteName", value: "BCS Insight" },
  });

  console.log("\n✅ Seed complete.");
  console.log("   Admin:    admin@bcsinsight.test / Password123!");
  console.log("   Students: student1..3@bcsinsight.test / Password123!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
