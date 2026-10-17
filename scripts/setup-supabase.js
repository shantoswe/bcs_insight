// Verify a Supabase project is reachable and provision its storage buckets.
// Run after pointing .env at a new project:
//     npm run setup:supabase
//
// Then:  npx prisma migrate deploy  &&  npm run db:seed

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const BUCKETS = [
  { name: "files", public: true },            // written PDFs, voice, site assets, images
  { name: "avatars", public: false },
  { name: "question-images", public: false },
  { name: "course-assets", public: false },
];

function bail(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

if (!URL || !SERVICE) bail("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env");

console.log(`\nProject: ${URL}`);

// 1) Auth / API reachable?
process.stdout.write("1. Auth endpoint      ... ");
try {
  const res = await fetch(`${URL}/auth/v1/health`, { signal: AbortSignal.timeout(10000) });
  console.log(`reachable (HTTP ${res.status})`);
} catch (e) {
  console.log("UNREACHABLE");
  bail(`Cannot reach ${URL}. If DNS says NXDOMAIN the project is paused or deleted — check your Supabase dashboard.`);
}

// 2) Database reachable?
process.stdout.write("2. Database           ... ");
const prisma = new PrismaClient();
let dbOk = false;
try {
  await prisma.$queryRaw`SELECT 1`;
  console.log("connected");
  dbOk = true;
} catch (e) {
  console.log("NOT CONNECTED");
  console.log(`   → ${String(e.message).split("\n").find((l) => l.trim()) ?? ""}`);
  console.log("   → Check DATABASE_URL / DIRECT_URL in .env (use the IPv4 pooler host).");
}

// 3) Storage buckets
process.stdout.write("3. Storage buckets    ... ");
const supabase = createClient(URL, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws },
});
const results = [];
for (const b of BUCKETS) {
  const { error } = await supabase.storage.createBucket(b.name, {
    public: b.public,
    fileSizeLimit: "52428800",
  });
  if (!error) results.push(`${b.name}: created`);
  else if (/exist/i.test(error.message)) results.push(`${b.name}: ok`);
  else results.push(`${b.name}: ERROR ${error.message}`);
}
console.log("done");
results.forEach((r) => console.log(`   • ${r}`));

await prisma.$disconnect();

console.log("\nNext steps:");
if (!dbOk) {
  console.log("  • Fix DATABASE_URL / DIRECT_URL, then re-run this script.");
} else {
  console.log("  • npx prisma migrate deploy      # create tables");
  console.log("  • npm run db:seed                # demo data + admin account");
  console.log("  • npm run dev");
}
console.log("");
