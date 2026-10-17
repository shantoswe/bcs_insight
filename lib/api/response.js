import { NextResponse } from "next/server";

// Consistent JSON envelope: { success, data, message, meta }

export function ok(data = null, { message = null, meta = null, status = 200 } = {}) {
  return NextResponse.json({ success: true, data, message, meta }, { status });
}

export function fail(message, { status = 400, meta = null } = {}) {
  return NextResponse.json({ success: false, data: null, message, meta }, { status });
}

export function zodFail(zodError) {
  const errors = zodError.issues.map((i) => ({
    field: i.path.join("."),
    message: i.message,
  }));
  return fail("Validation failed", { status: 422, meta: { errors } });
}

export function paginationMeta({ page, limit, total }) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export function parsePagination(searchParams, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(searchParams.get("limit") ?? String(defaultLimit), 10) || defaultLimit)
  );
  return { page, limit, skip: (page - 1) * limit, take: limit };
}
