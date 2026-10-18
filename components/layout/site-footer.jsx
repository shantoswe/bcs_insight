import Link from "next/link";
import { Facebook, Instagram, Youtube, Send, Mail, Phone, MapPin, GraduationCap } from "lucide-react";

// Columns, about text and copyright are all editable in admin → হেডার ও ফুটার.
const FALLBACK_COLUMNS = [
  { id: "f1", title: "দ্রুত লিংক", links: [
    { id: "a", label: "হোম", href: "/" },
    { id: "b", label: "কোর্সসমূহ", href: "/courses" },
    { id: "c", label: "মক টেস্ট", href: "/exams" },
  ] },
];

export function SiteFooter({ brand, settings }) {
  const s = settings ?? {};
  const siteName = brand?.siteName || s.siteName || "BCS Insight";
  const columns = (Array.isArray(s["footer.columns"]) && s["footer.columns"].length
    ? s["footer.columns"]
    : FALLBACK_COLUMNS
  ).filter((c) => c?.title || c?.links?.length);
  const copyright = (s["footer.copyright"] || "© {year} {siteName}. সর্বস্বত্ব সংরক্ষিত।")
    .replace("{year}", new Date().getFullYear())
    .replace("{siteName}", siteName);
  const socials = [
    [Facebook, s["social.facebook"], "Facebook"],
    [Instagram, s["social.instagram"], "Instagram"],
    [Youtube, s["social.youtube"], "YouTube"],
    [Send, s["social.whatsapp"], "WhatsApp"],
  ].filter(([, href]) => !!href);

  return (
    <footer className="bg-navy text-navy-foreground">
      <div className="mx-auto grid max-w-6xl gap-9 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* brand */}
        <div>
          <Link href="/" className="flex items-center gap-2">
            {brand?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logoUrl} alt={brand?.siteName} className="size-8 rounded-md object-contain" />
            ) : (
              <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <GraduationCap className="size-4" />
              </span>
            )}
            <span className="text-lg font-bold">{siteName}</span>
          </Link>
          {s["footer.about"] !== "" && (
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/65">
              {s["footer.about"] ?? "সরকারি চাকরির প্রস্তুতিতে একটি পূর্ণাঙ্গ অনলাইন লার্নিং প্ল্যাটফর্ম।"}
            </p>
          )}
          {socials.length > 0 && (
            <div className="mt-4 flex gap-2">
              {socials.map(([Icon, href, label], i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex size-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-primary"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        {columns.map((c, i) => <FooterCol key={c.id ?? i} title={c.title} links={c.links ?? []} />)}

        {/* contact */}
        <div>
          <h4 className="mb-3 text-sm font-bold">{s["footer.contactTitle"] || "যোগাযোগ"}</h4>
          <ul className="space-y-2.5 text-sm text-white/65">
            {s["contact.email"] && (
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="break-all">{s["contact.email"]}</span>
              </li>
            )}
            {s["contact.phone"] && (
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{s["contact.phone"]}</span>
              </li>
            )}
            {s["contact.address"] && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{s["contact.address"]}</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-5 text-center text-xs text-white/55">
          {copyright}
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-bold">{title}</h4>
      <ul className="space-y-2.5 text-sm text-white/65">
        {links.filter((l) => l?.label && l?.href).map((l, i) => (
          <li key={l.id ?? i}>
            <Link href={l.href} className="transition hover:text-primary">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
