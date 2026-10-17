import "server-only";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

// Service-role client — bypasses RLS. Server-side only.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      // Node < 22 lacks a global WebSocket; realtime is unused but the
      // client constructs it eagerly.
      realtime: { transport: ws },
    }
  );
}
