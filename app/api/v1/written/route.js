import { withAuth } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { listWrittenForStudent } from "@/lib/services/written.service";

export const GET = withAuth(async () => ok(await listWrittenForStudent()));
