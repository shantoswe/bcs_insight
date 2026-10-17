import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function AuthLayout({ children }) {
  return (
    <div className="brand-gradient-soft flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2 text-xl font-bold">
        <span className="flex size-10 items-center justify-center rounded-xl brand-gradient text-white">
          <GraduationCap className="size-6" />
        </span>
        AUS Prep
      </Link>
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()} AUS Prep
      </p>
    </div>
  );
}
