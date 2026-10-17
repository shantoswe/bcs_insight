"use client";

import { Suspense, useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/track";

// Injects Meta Pixel + Google Analytics 4 (+ optional GTM) and fires a
// deduplicated PageView on every App-Router navigation. IDs come from admin
// settings (with env fallback); nothing renders when they're unset.
export function Analytics({ metaPixelId, gaMeasurementId, gtmId }) {
  return (
    <>
      {metaPixelId && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${metaPixelId}');`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              alt=""
              src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      )}

      {gaMeasurementId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','${gaMeasurementId}',{send_page_view:false});`}
          </Script>
        </>
      )}

      {gtmId && (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),
event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?
'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
        </Script>
      )}

      {(metaPixelId || gaMeasurementId) && (
        <Suspense fallback={null}>
          <RouteTracker enabled={!!(metaPixelId || gaMeasurementId)} />
        </Suspense>
      )}
    </>
  );
}

function RouteTracker({ enabled }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const first = useRef(true);

  useEffect(() => {
    if (!enabled) return;
    // small delay so fbq/gtag are defined on first load
    const t = setTimeout(() => {
      trackEvent("PageView", { page_path: pathname, page_location: typeof location !== "undefined" ? location.href : undefined });
    }, first.current ? 400 : 0);
    first.current = false;
    return () => clearTimeout(t);
    // re-fire on path or query change
  }, [pathname, searchParams, enabled]);

  return null;
}
