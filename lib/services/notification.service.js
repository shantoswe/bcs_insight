import { prisma } from "@/lib/prisma";

// Returns how many rows were created so admins get a count.
export async function notifyAllStudents(payload) {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT", isBanned: false },
    select: { id: true },
  });
  if (students.length === 0) return 0;
  const { count } = await prisma.notification.createMany({
    data: students.map((s) => ({ userId: s.id, ...payload })),
  });
  return count;
}

export async function notifyCourseStudents(courseId, payload) {
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    select: { userId: true },
  });
  if (enrollments.length === 0) return 0;
  const { count } = await prisma.notification.createMany({
    data: enrollments.map((e) => ({ userId: e.userId, ...payload })),
  });
  return count;
}

// Student inbox: page of notifications + total + unread count.
export async function listMyNotifications(userId, { skip = 0, take = 15 } = {}) {
  const [items, total, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);
  return { items, total, unread };
}

// Mark read by ids, or all.
export async function markNotificationsRead(userId, { ids, all } = {}) {
  const where = { userId, isRead: false, ...(all ? {} : { id: { in: ids ?? [] } }) };
  const { count } = await prisma.notification.updateMany({ where, data: { isRead: true } });
  return count;
}
