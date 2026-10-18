import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

// Site wordmark. Renders the uploaded logo (Settings → হোমপেজ ও SEO → লোগো)
// when one is set, otherwise a clean monogram tile. Safe in server or client
// components — it holds no state.
const SIZES = {
  sm: { box: "size-8", icon: "size-4", text: "text-base" },
  md: { box: "size-9", icon: "size-5", text: "text-lg" },
  lg: { box: "size-10", icon: "size-6", text: "text-xl" },
};

export function BrandMark({
  siteName = "BCS Insight",
  logoUrl,
  href = "/",
  size = "md",
  showName = true,
  className,
}) {
  const s = SIZES[size] ?? SIZES.md;
  const inner = (
    <>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={siteName} className={cn(s.box, "rounded-md object-contain")} />
      ) : (
        <span className={cn(s.box, "flex items-center justify-center rounded-md bg-primary text-primary-foreground")}>
          <GraduationCap className={s.icon} />
        </span>
      )}
      {showName && <span className={cn(s.text, "font-semibold tracking-tight")}>{siteName}</span>}
    </>
  );

  if (!href) return <span className={cn("flex items-center gap-2", className)}>{inner}</span>;
  return (
    <Link href={href} className={cn("flex items-center gap-2", className)}>
      {inner}
    </Link>
  );
}
