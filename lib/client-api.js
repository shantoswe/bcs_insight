"use client";

// Thin fetch wrapper for the { success, data, message, meta } envelope.
// Throws an Error (with .status and .meta) on failure so callers can toast.
export async function api(path, { method = "GET", body, headers, signal } = {}) {
  const res = await fetch(path, {
    method,
    headers: {
      ...(body != null && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body instanceof FormData ? body : body != null ? JSON.stringify(body) : undefined,
    signal,
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON response */
  }

  if (!res.ok || (json && json.success === false)) {
    const err = new Error(json?.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.meta = json?.meta ?? null;
    throw err;
  }
  return json?.data ?? null;
}

export const get = (p, o) => api(p, { ...o, method: "GET" });
export const post = (p, body, o) => api(p, { ...o, method: "POST", body });
export const patch = (p, body, o) => api(p, { ...o, method: "PATCH", body });
export const del = (p, o) => api(p, { ...o, method: "DELETE" });
