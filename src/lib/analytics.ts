import posthog from "posthog-js";
import { env } from "./env";

const SAFE_KEYS = new Set([
  "status",
  "source",
  "tier",
  "templateId",
  "pageLength",
  "score",
  "roleCategory",
  "language",
  "platform",
]);

let initialized = false;

export function initAnalytics() {
  if (!env.POSTHOG_KEY || initialized) return;
  posthog.init(env.POSTHOG_KEY, {
    api_host: env.POSTHOG_HOST,
    capture_pageview: false,
    autocapture: false,
  });
  initialized = true;
}

export function trackEvent(event: string, properties: Record<string, unknown> = {}) {
  if (!initialized) return;
  const safeProperties = Object.fromEntries(
    Object.entries(properties).filter((entry) => SAFE_KEYS.has(entry[0])),
  );
  try {
    posthog.capture(event, safeProperties);
  } catch {
    // Analytics must never break the app.
  }
}
