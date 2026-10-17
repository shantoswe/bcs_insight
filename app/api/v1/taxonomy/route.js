import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { fullTaxonomy } from "@/lib/services/taxonomy.service";

// Full category → subject → topic tree for filters and admin pickers.
export const GET = withAuth(async () => {
  const tree = await fullTaxonomy();
  return ok(tree);
});
