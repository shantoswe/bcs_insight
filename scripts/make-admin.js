// Promote an existing user to ADMIN by email.
//   npm run make-admin -- you@example.com
//
// (Sign out and back in afterwards so the new role reaches your session.)

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const prisma = new PrismaClient();
const email = process.argv[2];

if (!email) {
  console.error("Usage: npm run make-admin -- you@example.com");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws },
  }
);

const user = await prisma.user.findUnique({ where: { email } });
if (!user) {
  console.error(`No user found with email ${email}. Register in the app first.`);
  process.exit(1);
}

await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN", permissions: [] } });
await supabase.auth.admin.updateUserById(user.id, { app_metadata: { role: "ADMIN" } });

console.log(`✅ ${email} is now an ADMIN. Sign out and back in to refresh your session.`);
await prisma.$disconnect();
