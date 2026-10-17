-- Defense-in-depth: enforce ONE live-exam attempt per user at the database
-- level. The app already guards this in code (startAttempt), but this partial
-- unique index closes the race window. Run it ONCE after the first migration:
--
--   psql "$DIRECT_URL" -f prisma/manual/one_live_attempt.sql
--
-- Prisma cannot express a partial (WHERE) unique index, so it lives here.

CREATE UNIQUE INDEX IF NOT EXISTS "Attempt_one_live_per_user"
  ON "Attempt" ("examId", "userId")
  WHERE ("examType" = 'LIVE' AND "isArchive" = false);
