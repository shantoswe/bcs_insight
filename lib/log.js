// Throttled, non-fatal logging. Uses console.warn (not error) so Next's dev
// overlay doesn't surface expected, already-handled degradations as crashes.
const last = new Map();

export function warnThrottled(key, ...args) {
  const now = Date.now();
  if (now - (last.get(key) ?? 0) < 30_000) return;
  last.set(key, now);
  console.warn(...args);
}
