// Permission keys mirror the admin nav. ADMIN implicitly has all;
// MODERATOR has only the keys in User.permissions.
export const PERMISSIONS = [
  { key: "dashboard", bn: "ড্যাশবোর্ড", en: "Dashboard" },
  { key: "taxonomy", bn: "বিষয়", en: "Subjects" },
  { key: "questions", bn: "প্রশ্ন", en: "Questions" },
  { key: "exams", bn: "পরীক্ষা", en: "Exams" },
  { key: "written", bn: "লিখিত", en: "Written" },
  { key: "courses", bn: "কোর্স", en: "Courses" },
  { key: "users", bn: "ইউজার", en: "Users" },
  { key: "settings", bn: "সেটিংস", en: "Settings" },
];

export function isStaff(user) {
  return user?.role === "ADMIN" || user?.role === "MODERATOR";
}

export function hasPermission(user, permission) {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  if (user.role !== "MODERATOR") return false;
  if (!permission) return true; // "any staff" check
  return user.permissions?.includes(permission) ?? false;
}

// Infer required permission from an admin API pathname.
export function permissionForPath(pathname) {
  if (pathname.startsWith("/api/v1/admin/users/search")) return null;
  const seg = pathname.replace(/^\/api\/v1\/admin\/?/, "").split("/")[0] ?? "";
  switch (seg) {
    case "users":
      return "users";
    case "categories":
    case "subjects":
    case "topics":
      return "taxonomy";
    case "questions":
    case "imports":
      return "questions";
    case "exams":
    case "attempts":
      return "exams";
    case "written":
      return "written";
    case "courses":
    case "sections":
    case "lessons":
    case "payments":
      return "courses";
    case "settings":
    case "files":
      return "settings";
    default:
      return "dashboard";
  }
}
