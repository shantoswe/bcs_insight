import Link from "next/link";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BannedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-destructive/12 text-destructive">
        <Ban className="size-8" />
      </span>
      <h1 className="mt-5 text-2xl font-bold">অ্যাকাউন্ট নিষিদ্ধ</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        আপনার অ্যাকাউন্টটি সাময়িকভাবে নিষিদ্ধ করা হয়েছে। বিস্তারিত জানতে সহায়তা টিমের সাথে যোগাযোগ করুন।
      </p>
      <Button asChild variant="outline" className="mt-6"><Link href="/">হোমে ফিরুন</Link></Button>
    </div>
  );
}
