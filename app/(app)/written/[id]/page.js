import { WrittenRoom } from "@/components/written/written-room";

export const metadata = { title: "লিখিত পরীক্ষা" };

export default async function WrittenTakePage({ params }) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <WrittenRoom writtenExamId={id} />
    </div>
  );
}
