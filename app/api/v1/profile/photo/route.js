import { withAuth } from "@/lib/api/guard";
import { ok, fail } from "@/lib/api/response";
import { uploadProfilePhoto } from "@/lib/services/user.service";

// Avatar upload (multipart). Small images pass through the server to the
// private "avatars" bucket; a signed URL is returned.
export const POST = withAuth(async (request, { user }) => {
  const form = await request.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") return fail("No file uploaded");
  if (!/^image\//.test(file.type)) return fail("Only image files are allowed");
  if (file.size > 5 * 1024 * 1024) return fail("Max 5 MB");

  const photoUrl = await uploadProfilePhoto(user.id, file);
  return ok({ photoUrl }, { message: "ছবি হালনাগাদ হয়েছে" });
});
