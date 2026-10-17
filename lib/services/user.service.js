import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";

const AVATAR_BUCKET = "avatars";
const SIGNED_URL_TTL = 60 * 60; // 1h

// Upsert our User row from the Supabase auth user (called on every
// authenticated request via the guard — a cheap upsert keeps the DB in sync).
export async function syncUserFromAuth(authUser) {
  const name =
    authUser.user_metadata?.name ??
    authUser.user_metadata?.full_name ??
    authUser.email?.split("@")[0] ??
    "Student";

  return prisma.user.upsert({
    where: { id: authUser.id },
    update: { email: authUser.email },
    create: { id: authUser.id, email: authUser.email, name },
  });
}

export async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      nameBn: true,
      phone: true,
      photoPath: true,
      role: true,
      targetExam: true,
      createdAt: true,
    },
  });
  if (!user) return null;
  return { ...user, photoUrl: await signedPhotoUrl(user.photoPath) };
}

export async function updateProfile(userId, data) {
  const user = await prisma.user.update({ where: { id: userId }, data });
  return { ...user, photoUrl: await signedPhotoUrl(user.photoPath) };
}

async function signedPhotoUrl(path) {
  if (!path) return null;
  const supabase = createAdminClient();
  const { data } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
  return data?.signedUrl ?? null;
}

// Uploads an avatar to the private "avatars" bucket and returns a signed URL.
export async function uploadProfilePhoto(userId, file) {
  const ext = (file.name?.split(".").pop() ?? "jpg").toLowerCase();
  const path = `${userId}/avatar.${ext}`;
  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);
  await prisma.user.update({ where: { id: userId }, data: { photoPath: path } });
  return signedPhotoUrl(path);
}

// ---- Admin ----

export async function listUsers({ search, role, banned, skip, take }) {
  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ],
    }),
    ...(role && { role }),
    ...(banned != null && { isBanned: banned }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        permissions: true,
        targetExam: true,
        isBanned: true,
        bannedAt: true,
        banReason: true,
        createdAt: true,
        _count: { select: { attempts: true, enrollments: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}

export async function searchUsers(q, { limit = 8 } = {}) {
  if (!q?.trim()) return [];
  const term = q.trim();
  return prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        { phone: { contains: term } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, name: true, email: true, phone: true, role: true, isBanned: true },
  });
}

export async function setBanStatus(userId, { isBanned, banReason = null }) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      isBanned,
      banReason: isBanned ? banReason : null,
      bannedAt: isBanned ? new Date() : null,
    },
  });

  if (isBanned) {
    const supabase = createAdminClient();
    await supabase.auth.admin.signOut(userId, "global").catch(() => {});
  }
  return user;
}

export async function setRole(userId, role, permissions = []) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role, permissions: role === "MODERATOR" ? permissions : [] },
  });

  // Mirror into auth app_metadata so middleware can gate /admin without a DB hit.
  // DB stays the source of truth; API guards always re-check the DB.
  const supabase = createAdminClient();
  await supabase.auth.admin
    .updateUserById(userId, { app_metadata: { role } })
    .catch(() => {});
  return user;
}

export async function deleteUser(userId) {
  await prisma.importBatch.deleteMany({ where: { createdById: userId } });
  await prisma.user.delete({ where: { id: userId } });
  const supabase = createAdminClient();
  await supabase.auth.admin.deleteUser(userId).catch(() => {});
}
