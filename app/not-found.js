import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl brand-gradient text-white">
        <Compass className="size-8" />
      </span>
      <h1 className="mt-5 text-3xl font-bold">৪০৪</h1>
      <p className="mt-2 text-muted-foreground">যে পেজটি খুঁজছেন সেটি পাওয়া যায়নি।</p>
      <Button asChild className="mt-6"><Link href="/">হোমে ফিরুন</Link></Button>
    </div>
  );
}
