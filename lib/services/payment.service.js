import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api/errors";
import { enroll, isEnrolled } from "@/lib/services/course.service";

// ---- student ----

// Submit a manual payment for a paid course. Blocks duplicates while one is
// pending and no-ops if already enrolled.
export async function createPaymentRequest(userId, courseId, data) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, isFree: true, priceBDT: true },
  });
  if (!course) throw new ApiError("Course not found", 404);
  if (course.isFree || Number(course.priceBDT) === 0)
    throw new ApiError("এই কোর্সটি ফ্রি — সরাসরি এনরোল করুন", 400);
  if (await isEnrolled(userId, courseId))
    throw new ApiError("আপনি ইতিমধ্যে এই কোর্সে ভর্তি আছেন", 409);

  const pending = await prisma.paymentRequest.findFirst({
    where: { userId, courseId, status: "PENDING" },
    select: { id: true },
  });
  if (pending) throw new ApiError("আপনার একটি অনুরোধ যাচাইয়ের অপেক্ষায় আছে", 409);

  return prisma.paymentRequest.create({
    data: {
      userId,
      courseId,
      method: data.method,
      senderNumber: data.senderNumber || null,
      trxLast4: data.trxLast4,
      trxId: data.trxId || null,
      amount: data.amount,
    },
  });
}

// Latest request for a course (to show the student their status).
export function myRequestForCourse(userId, courseId) {
  return prisma.paymentRequest.findFirst({
    where: { userId, courseId },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, method: true, amount: true, adminNote: true, createdAt: true },
  });
}

// ---- admin ----

export function listPaymentRequests({ status } = {}) {
  return prisma.paymentRequest.findMany({
    where: { ...(status && { status }) },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      user: { select: { id: true, name: true, nameBn: true, email: true, phone: true } },
      course: { select: { id: true, titleBn: true, titleEn: true, priceBDT: true } },
    },
  });
}

export async function pendingPaymentCount() {
  return prisma.paymentRequest.count({ where: { status: "PENDING" } });
}

// Approve (→ enroll + notify) or reject a payment request.
export async function reviewPaymentRequest(id, reviewerId, { action, adminNote }) {
  const req = await prisma.paymentRequest.findUnique({
    where: { id },
    include: { course: { select: { titleBn: true, titleEn: true } } },
  });
  if (!req) throw new ApiError("Request not found", 404);
  if (req.status !== "PENDING") throw new ApiError("এই অনুরোধটি ইতিমধ্যে যাচাই হয়েছে", 409);

  const status = action === "approve" ? "APPROVED" : "REJECTED";
  await prisma.paymentRequest.update({
    where: { id },
    data: { status, adminNote: adminNote || null, reviewedById: reviewerId, reviewedAt: new Date() },
  });

  const title = req.course.titleBn || req.course.titleEn;
  if (action === "approve") {
    await enroll(req.userId, req.courseId);
    await prisma.notification.create({
      data: {
        userId: req.userId,
        type: "SYSTEM",
        title: "পেমেন্ট অনুমোদিত ✓",
        body: `"${title}" কোর্সে আপনার ভর্তি নিশ্চিত হয়েছে। এখনই শেখা শুরু করুন।`,
        link: "/courses",
      },
    });
  } else {
    await prisma.notification.create({
      data: {
        userId: req.userId,
        type: "SYSTEM",
        title: "পেমেন্ট বাতিল",
        body: `"${title}" কোর্সের পেমেন্ট যাচাই করা যায়নি।${adminNote ? " কারণ: " + adminNote : ""}`,
        link: "/courses",
      },
    });
  }

  return { status };
}
