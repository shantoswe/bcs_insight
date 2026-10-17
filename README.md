# AUS Prep — চাকরির পরীক্ষার প্রস্তুতি প্ল্যাটফর্ম

A full exam-prep e-learning platform: MCQ practice, timed live mock tests with
merit lists, a written-exam module with model answers and evaluator workflow,
and Bunny Stream video courses with progress tracking. Bilingual (বাংলা +
English) throughout.

Built by unifying two reference apps into one clean codebase — the Supabase
auth + bulk MCQ upload from `aus-bcs`, and the exam/written/results features
from `alokbortika` — on a single reconciled Prisma schema.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, JavaScript only) |
| Auth + DB | Supabase (email/password auth, Postgres, Storage) |
| ORM | Prisma 6 |
| UI | Tailwind CSS v4 + shadcn/ui, light vibrant theme |
| Video | Bunny Stream (direct browser → Bunny TUS upload) |
| Deploy | DigitalOcean droplet · Nginx · PM2 · `next start` (not Vercel) |

## Features

- **Auth & roles** — Supabase email/password, protected routes, `ADMIN` /
  `MODERATOR` (per-menu permissions) / `STUDENT`, ban system.
- **MCQ system** — bulk upload for admins (CSV / Excel / paste) with subject,
  topic and difficulty tagging, row-by-row validation, in-file + DB duplicate
  detection via content hash, preview → commit. Student practice with instant
  feedback and explanations.
- **Exam engine** — timed practice + live mock tests: server-side countdown and
  deadline, per-attempt question/option shuffle, auto-submit, auto-scoring with
  negative marking, subject-wise breakdown, answer review, and a merit-list
  leaderboard. Anti-cheat tab-switch logging.
- **Written module** — long-form questions with model answers (shown after
  submit) and an evaluator workflow (per-answer marks + feedback).
- **Video courses** — courses → sections → lessons, Bunny direct upload so
  video bytes skip the Node server, an iframe player, free previews, and
  per-lesson progress tracking.
- **Admin dashboard** — one area for questions, exams, written exams, courses,
  taxonomy, users and site settings.

## Local development

```bash
cp .env.example .env      # fill in Supabase, DATABASE_URL/DIRECT_URL, Bunny
npm install
npx prisma migrate dev    # create tables
psql "$DIRECT_URL" -f prisma/manual/one_live_attempt.sql   # one-live-attempt index
npm run db:seed           # demo data + admin@ausprep.test / Password123!
npm run dev               # http://localhost:3000
```

Create the three private Supabase Storage buckets first: `avatars`,
`question-images`, `course-assets`.

### Seed accounts

- **Admin:** `admin@ausprep.test` / `Password123!`
- **Students:** `student1..3@ausprep.test` / `Password123!`

To promote your own account: register, then `npm run make-admin -- you@example.com`.

## Project structure

```
prisma/            schema.prisma · seed.js · manual/one_live_attempt.sql
lib/
  supabase/        browser · server · service-role clients
  api/             guard (withAuth/withAdmin) · response envelope · rate limit
  auth/            session helpers · permission map
  services/        business logic (users, taxonomy, questions, import, exam,
                   attempt, scoring, written, course, bunny, progress, stats)
  validators/      zod schemas
app/
  (auth)/          login · register · forgot-password
  (app)/           dashboard · exams · practice · written · courses · mistakes · profile
  attempts/[id]/   fullscreen exam room + result
  admin/           questions · exams · written · courses · taxonomy · users · settings
  api/v1/          enveloped REST route handlers + api/v1/admin/bunny/* (upload signing)
components/        ui (shadcn) · layout · exams · practice · written · courses · admin
middleware.js      Supabase session refresh + optimistic route gating
ecosystem.config.cjs · deploy/nginx.conf.example · DEPLOY.md
```

## Deployment

See [DEPLOY.md](./DEPLOY.md) for the full DigitalOcean + Nginx + PM2 +
Let's Encrypt walkthrough.

## Security notes

- Correct answers never reach the client before an attempt is submitted;
  all scoring is server-side.
- Deadlines are computed and enforced on the server (30 s grace).
- The Bunny API key stays server-side; the browser only receives a short-lived
  presigned upload signature.
- The in-memory rate limiter and live-exam sweep assume a single PM2 instance.
# bcs_insight
