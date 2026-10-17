import "server-only";
import crypto from "crypto";
import { getTrackingConfig } from "@/lib/services/settings.service";

// Server-side conversion tracking:
//   • Meta Conversions API (CAPI)  → graph.facebook.com/.../events
//   • GA4 Measurement Protocol     → google-analytics.com/mp/collect
// Both are best-effort and never throw into the request path. Browser events
// share the same `eventId` so Meta/GA deduplicate the server + browser copy.

const META_VERSION = "v21.0";

// small in-memory cache so we don't hit the settings table on every event
let cfgCache = { at: 0, cfg: null };
async function config() {
  if (Date.now() - cfgCache.at < 60_000 && cfgCache.cfg) return cfgCache.cfg;
  let pub = {};
  try {
    pub = await getTrackingConfig();
  } catch {
    /* DB unavailable — fall back to env below */
  }
  const cfg = {
    metaPixelId: pub.metaPixelId || process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
    metaToken: process.env.META_CONVERSIONS_API_TOKEN || "",
    metaTestCode: process.env.META_TEST_EVENT_CODE || "",
    gaMeasurementId: pub.gaMeasurementId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "",
    gaApiSecret: process.env.GA_API_SECRET || "",
  };
  cfgCache = { at: Date.now(), cfg };
  return cfg;
}

// SHA-256 hex of a normalized value (Meta requires lowercased/trimmed PII).
function hash(value, { phone = false } = {}) {
  if (!value) return undefined;
  let v = String(value).trim().toLowerCase();
  if (phone) v = v.replace(/[^0-9]/g, "");
  if (!v) return undefined;
  return crypto.createHash("sha256").update(v).digest("hex");
}

// Pull IP, UA and Meta/GA cookies from an incoming request.
export function requestContext(request) {
  const h = request.headers;
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || undefined;
  const userAgent = h.get("user-agent") || undefined;
  const cookieHeader = h.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const i = c.indexOf("=");
      return [c.slice(0, i).trim(), decodeURIComponent(c.slice(i + 1) || "")];
    })
  );
  // GA client_id lives inside the _ga cookie: "GA1.1.<id>.<ts>" → "<id>.<ts>"
  let gaClientId;
  if (cookies._ga) {
    const parts = cookies._ga.split(".");
    if (parts.length >= 4) gaClientId = `${parts[2]}.${parts[3]}`;
  }
  return { ip, userAgent, fbp: cookies._fbp, fbc: cookies._fbc, gaClientId };
}

async function sendMeta({ eventName, eventId, eventSourceUrl, userData = {}, customData = {}, ctx = {} }) {
  const { metaPixelId, metaToken, metaTestCode } = await config();
  if (!metaPixelId || !metaToken) return { skipped: "meta" };

  const user_data = {
    ...(userData.email ? { em: [hash(userData.email)] } : {}),
    ...(userData.phone ? { ph: [hash(userData.phone, { phone: true })] } : {}),
    ...(userData.externalId ? { external_id: [hash(userData.externalId)] } : {}),
    ...(ctx.ip ? { client_ip_address: ctx.ip } : {}),
    ...(ctx.userAgent ? { client_user_agent: ctx.userAgent } : {}),
    ...(ctx.fbp ? { fbp: ctx.fbp } : {}),
    ...(ctx.fbc ? { fbc: ctx.fbc } : {}),
  };

  const body = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        ...(eventSourceUrl ? { event_source_url: eventSourceUrl } : {}),
        user_data,
        custom_data: customData,
      },
    ],
    ...(metaTestCode ? { test_event_code: metaTestCode } : {}),
  };

  const res = await fetch(
    `https://graph.facebook.com/${META_VERSION}/${metaPixelId}/events?access_token=${encodeURIComponent(metaToken)}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
  );
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.error("[meta capi]", res.status, t.slice(0, 200));
  }
  return { sent: "meta" };
}

async function sendGa4({ eventName, params = {}, clientId, userId }) {
  const { gaMeasurementId, gaApiSecret } = await config();
  if (!gaMeasurementId || !gaApiSecret) return { skipped: "ga" };

  const body = {
    client_id: clientId || `${Math.floor(Math.random() * 1e10)}.${Math.floor(Date.now() / 1000)}`,
    ...(userId ? { user_id: userId } : {}),
    events: [{ name: eventName, params: { engagement_time_msec: 1, ...params } }],
  };

  const res = await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${gaMeasurementId}&api_secret=${encodeURIComponent(gaApiSecret)}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
  );
  if (!res.ok) console.error("[ga4 mp]", res.status);
  return { sent: "ga" };
}

// GA4 event names must be snake_case; keep a small map from our Meta-style names.
const GA_NAME = {
  PageView: "page_view",
  CompleteRegistration: "sign_up",
  Lead: "generate_lead",
  Purchase: "purchase",
  StartTrial: "start_trial",
  ViewContent: "view_content",
  StartExam: "start_exam",
  SubmitExam: "submit_exam",
  EnrollCourse: "enroll_course",
};

// Fire one conversion to both Meta and GA4. Never throws.
export async function track({ event, request, eventId, url, userData = {}, customData = {}, clientId } = {}) {
  const id = eventId || crypto.randomUUID();
  const ctx = request ? requestContext(request) : {};
  try {
    await Promise.allSettled([
      sendMeta({ eventName: event, eventId: id, eventSourceUrl: url, userData, customData, ctx }),
      sendGa4({
        eventName: GA_NAME[event] || event.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase(),
        params: customData,
        clientId: clientId || ctx.gaClientId,
        userId: userData.externalId,
      }),
    ]);
  } catch (e) {
    console.error("[track]", e);
  }
  return { eventId: id };
}
