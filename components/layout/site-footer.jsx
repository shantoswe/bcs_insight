import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div className="sm:col-span-2 md:col-span-1">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="flex size-8 items-center justify-center rounded-lg brand-gradient text-white">
              <GraduationCap className="size-4" />
            </span>
            AUS Prep
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            চাকরির পরীক্ষার সম্পূর্ণ প্রস্তুতি — MCQ, লাইভ পরীক্ষা, লিখিত মডিউল ও ভিডিও কোর্স।
          </p>
        </div>
        <FooterCol
          title="পরীক্ষা"
          links={[
            ["পরীক্ষা তালিকা", "/exams"],
            ["MCQ প্র্যাকটিস", "/practice"],
            ["লিখিত পরীক্ষা", "/written"],
          ]}
        />
        <FooterCol
          title="শেখা"
          links={[
            ["ভিডিও কোর্স", "/courses"],
            ["ড্যাশবোর্ড", "/dashboard"],
            ["ভুল খাতা", "/mistakes"],
          ]}
        />
        <FooterCol
          title="অ্যাকাউন্ট"
          links={[
            ["লগইন", "/login"],
            ["রেজিস্টার", "/register"],
            ["প্রোফাইল", "/profile"],
          ]}
        />
      </div>
      <div className="border-t py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} AUS Prep. All rights reserved.
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold">{title}</h4>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="hover:text-primary">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
