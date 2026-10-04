import { analytics } from "./client.js";

export function observePerformance() {
  let reportedError = false;
  const onError = () => {
    if (!reportedError) {
      reportedError = true;
      analytics.track("client_error", { stage: "unhandled" });
    }
  };
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onError);
  const observers = [];
  if (typeof PerformanceObserver !== "undefined") {
    for (const type of ["largest-contentful-paint", "layout-shift"]) {
      try {
        let latest = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (type === "layout-shift" && !entry.hadRecentInput)
              latest += entry.value;
            if (type === "largest-contentful-paint") latest = entry.startTime;
          }
          observer.latest = latest;
        });
        observer.observe({ type, buffered: true });
        observer.metric = type;
        observers.push(observer);
      } catch {
        /* Browser does not support this metric. */
      }
    }
  }
  let performanceSent = false;
  const onHidden = () => {
    if (document.visibilityState !== "hidden" || performanceSent) return;
    performanceSent = true;
    for (const observer of observers)
      if (typeof observer.latest === "number")
        analytics.track("page_performance", {
          stage: observer.metric,
          value: observer.latest,
        });
  };
  document.addEventListener("visibilitychange", onHidden);
  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onError);
    document.removeEventListener("visibilitychange", onHidden);
    observers.forEach((observer) => observer.disconnect());
  };
}
