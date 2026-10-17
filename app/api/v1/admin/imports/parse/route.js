import { withAdmin } from "@/lib/api/guard";
import { ok } from "@/lib/api/response";
import { parseToEditable } from "@/lib/services/import.service";

// Parse CSV / Excel / paste / JSON file / JSON text into EDITABLE question
// objects for the preview step. { format, text?, base64? }
export const POST = withAdmin(async (request) => {
  const body = await request.json();
  const data = await parseToEditable({
    format: body.format || "csv",
    text: body.text,
    base64: body.base64,
  });
  return ok(data);
});
