export function trackEvent(name, payload = {}) {
  if (typeof window !== "undefined" && typeof window.va === "function") {
    window.va("event", {
      name,
      ...payload
    });
  }
}
