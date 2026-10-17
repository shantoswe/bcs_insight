"use client";

// Client-side event helper. Fires the browser Pixel + gtag event AND relays a
// server copy (Meta CAPI + GA4 MP) sharing the same eventId, so Meta/GA
// deduplicate the two. Safe to call even if trackers aren't configured.

function cookie(name) {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : "";
}

// GA client_id from the _ga cookie ("GA1.1.<id>.<ts>" → "<id>.<ts>")
export function gaClientId() {
  const ga = cookie("_ga");
  const parts = ga.split(".");
  return parts.length >= 4 ? `${parts[2]}.${parts[3]}` : undefined;
}

const GA_NAME = {
  PageView: "page_view",
  CompleteRegistration: "sign_up",
  Lead: "generate_lead",
  Purchase: "purchase",
  ViewContent: "view_content",
  StartExam: "start_exam",
  SubmitExam: "submit_exam",
  EnrollCourse: "enroll_course",
};

function uuid() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

export function trackEvent(name, customData = {}, userData) {
  const eventId = uuid();

  try {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", name, customData, { eventID: eventId });
    }
  } catch { /* ignore */ }

  try {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", GA_NAME[name] || name.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase(), customData);
    }
  } catch { /* ignore */ }

  try {
    fetch("/api/v1/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        event: name,
        eventId,
        url: typeof location !== "undefined" ? location.href : undefined,
        customData,
        userData,
        clientId: gaClientId(),
      }),
    }).catch(() => {});
  } catch { /* ignore */ }

  return eventId;
}
