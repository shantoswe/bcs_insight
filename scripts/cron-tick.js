// One-shot cron tick, run every minute by PM2 (cron_restart).
// Calls the protected exam-processing endpoint on the local server.
const base = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";
const secret = process.env.CRON_SECRET;

if (!secret) {
  console.error("CRON_SECRET not set — skipping tick");
  process.exit(0);
}

try {
  const res = await fetch(`${base}/api/v1/cron/exams`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const json = await res.json().catch(() => ({}));
  console.log(`[cron] ${res.status}`, JSON.stringify(json.data ?? json));
} catch (e) {
  console.error("[cron] failed:", e.message);
}
process.exit(0);
