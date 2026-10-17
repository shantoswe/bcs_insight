import { PracticeRunner } from "@/components/practice/practice-runner";

export const metadata = { title: "MCQ প্র্যাকটিস" };

export default function PracticePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">MCQ প্র্যাকটিস</h1>
        <p className="text-muted-foreground">সঙ্গে সঙ্গে সঠিক উত্তর ও ব্যাখ্যা দেখে শিখুন।</p>
      </div>
      <PracticeRunner />
    </div>
  );
}
