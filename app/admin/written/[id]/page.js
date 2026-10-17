import { requireStaff } from "@/lib/auth/session";
import { WrittenBuilder } from "@/components/admin/written-builder";

export default async function AdminWrittenBuilderPage({ params }) {
  await requireStaff("written");
  const { id } = await params;
  return (
    <div className="p-5 lg:p-8">
      <WrittenBuilder writtenExamId={id} />
    </div>
  );
}
