// Map common Prisma error codes to clean API responses.
export function mapPrismaError(err) {
  if (!err || typeof err.code !== "string") return null;
  switch (err.code) {
    case "P2002":
      return { status: 409, message: "A record with this value already exists" };
    case "P2025":
      return { status: 404, message: "Record not found" };
    case "P2003":
      return { status: 409, message: "Related record constraint failed" };
    default:
      return null;
  }
}
