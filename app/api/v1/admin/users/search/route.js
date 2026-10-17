import { withAdmin } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { searchUsers } from "@/lib/services/user.service";

// Typeahead user search for course assignment etc.
export const GET = withAdmin(async (request) => {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  return ok(await searchUsers(q, { limit: 10 }));
});
