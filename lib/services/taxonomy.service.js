import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

// ---- Categories ----

export function listCategories({ activeOnly = false } = {}) {
  return prisma.jobCategory.findMany({
    where: activeOnly ? { isActive: true } : {},
    orderBy: { order: "asc" },
    include: { _count: { select: { subjects: true, exams: true, courses: true } } },
  });
}

export function createCategory(data) {
  return prisma.jobCategory.create({
    data: { ...data, slug: data.slug || slugify(data.nameEn) },
  });
}

export function updateCategory(id, data) {
  return prisma.jobCategory.update({ where: { id }, data });
}

export function deleteCategory(id) {
  return prisma.jobCategory.delete({ where: { id } });
}

// Categories shown as cards on the home page. Only categories that actually
// have published courses are returned, so every card leads somewhere real.
export async function listHomeCategories() {
  const cats = await prisma.jobCategory.findMany({
    where: { isActive: true, showOnHome: true },
    orderBy: [{ order: "asc" }, { nameBn: "asc" }],
    select: {
      id: true, slug: true, nameBn: true, nameEn: true, icon: true,
      imageUrl: true, color: true, highlights: true,
      _count: { select: { courses: { where: { isPublished: true } } } },
    },
  });
  return cats
    .map(({ _count, ...c }) => ({ ...c, courseCount: _count.courses }))
    .filter((c) => c.courseCount > 0);
}

// ---- Subjects ----

export function listSubjects({ categoryId } = {}) {
  return prisma.subject.findMany({
    where: { ...(categoryId && { categoryId }) },
    orderBy: [{ categoryId: "asc" }, { order: "asc" }],
    include: {
      category: { select: { nameEn: true, nameBn: true } },
      _count: { select: { topics: true, questions: true } },
    },
  });
}

export function createSubject(data) {
  return prisma.subject.create({
    data: { ...data, slug: data.slug || slugify(data.nameEn) },
  });
}

export function updateSubject(id, data) {
  return prisma.subject.update({ where: { id }, data });
}

export function deleteSubject(id) {
  return prisma.subject.delete({ where: { id } });
}

// ---- Topics (nested) ----

export function listTopics({ subjectId } = {}) {
  return prisma.topic.findMany({
    where: { ...(subjectId && { subjectId }) },
    orderBy: [{ order: "asc" }],
    include: { _count: { select: { questions: true, children: true } } },
  });
}

export function createTopic(data) {
  return prisma.topic.create({
    data: { ...data, slug: data.slug || slugify(data.nameEn) },
  });
}

export function updateTopic(id, data) {
  return prisma.topic.update({ where: { id }, data });
}

export function deleteTopic(id) {
  return prisma.topic.delete({ where: { id } });
}

// Full taxonomy tree for admin pickers / filters.
export async function fullTaxonomy() {
  const categories = await prisma.jobCategory.findMany({
    orderBy: { order: "asc" },
    include: {
      subjects: {
        orderBy: { order: "asc" },
        include: { topics: { orderBy: { order: "asc" } } },
      },
    },
  });
  return categories;
}
