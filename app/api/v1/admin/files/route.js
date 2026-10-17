import { withAdmin } from "@/lib/api/guard";
import { ok, fail } from "@/lib/api/response";
import { listFiles, deleteFile, uploadAsset } from "@/lib/services/files.service";

// GET ?bucket=&prefix= → list objects
export const GET = withAdmin(async (request) => {
  const p = new URL(request.url).searchParams;
  const data = await listFiles({ bucket: p.get("bucket") || "files", prefix: p.get("prefix") || "" });
  return ok(data);
});

// POST multipart (upload asset) OR JSON { bucket, path, action:"delete" }
export const POST = withAdmin(async (request) => {
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") return fail("No file uploaded");
    if (file.size > 8 * 1024 * 1024) return fail("Max 8 MB");
    const res = await uploadAsset(file, { folder: form.get("folder") || "site" });
    return ok(res, { message: "আপলোড হয়েছে" });
  }
  const body = await request.json();
  if (body.action === "delete") {
    await deleteFile({ bucket: body.bucket, path: body.path });
    return ok({ deleted: true }, { message: "মুছে ফেলা হয়েছে" });
  }
  return fail("Unsupported request");
});
