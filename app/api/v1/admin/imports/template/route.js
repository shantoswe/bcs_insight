import { withAdmin } from "@/lib/api/guard";
import { csvTemplate, jsonTemplate } from "@/lib/services/import.service";

// Download a CSV or JSON import template. ?format=csv|json
export const GET = withAdmin(async (request) => {
  const format = new URL(request.url).searchParams.get("format") || "csv";
  if (format === "json") {
    return new Response(jsonTemplate(), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="mcq-import-template.json"',
      },
    });
  }
  return new Response(csvTemplate(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="mcq-import-template.csv"',
    },
  });
});
