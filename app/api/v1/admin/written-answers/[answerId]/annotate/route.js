import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/api/guard";
import { prisma } from "@/lib/prisma";

// Save the annotated PDF URL onto a written answer (client uploaded it directly).
export const POST = withAdmin(async (request, { params }) => {
  const body = await request.json().catch(() => ({}));
  if (!body.url) return NextResponse.json({ error: "No URL provided" }, { status: 400 });

  await prisma.writtenAnswer.update({
    where: { id: params.answerId },
    data: { annotatedFileUrl: body.url },
  });
  return NextResponse.json({ success: true, url: body.url });
});
