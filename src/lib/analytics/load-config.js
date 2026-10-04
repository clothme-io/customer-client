let pending;
export function loadAnalyticsConfig() {
  pending ??= fetch("/api/analytics-config", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("Analytics configuration unavailable");
      return response.json();
    })
    .catch((error) => {
      pending = undefined;
      throw error;
    });
  return pending;
}
