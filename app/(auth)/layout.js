import { getBrand } from "@/lib/services/settings.service";
import { BrandMark } from "@/components/layout/brand-mark";

export default async function AuthLayout({ children }) {
  let brand = { siteName: "BCS Insight", logoUrl: "" };
  try { brand = await getBrand(); } catch {}
  return (
    <div className="brand-gradient-soft flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <BrandMark siteName={brand.siteName} logoUrl={brand.logoUrl} size="lg" className="mb-8" />
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()} {brand.siteName}
      </p>
    </div>
  );
}
