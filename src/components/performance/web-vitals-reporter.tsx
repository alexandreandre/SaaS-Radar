"use client";

import { useReportWebVitals } from "next/web-vitals";

type WebVitalMetric = {
  id: string;
  name: string;
  value: number;
  rating: string;
  navigationType: string;
};

function sendToAnalytics(metric: WebVitalMetric): void {
  if (process.env.NODE_ENV !== "production") return;

  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
    path: typeof window !== "undefined" ? window.location.pathname : "",
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/metrics/web-vitals", body);
    return;
  }

  void fetch("/api/metrics/web-vitals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
}

/** Rapporte LCP, INP, CLS, TTFB, FCP en prod via sendBeacon. */
export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    sendToAnalytics(metric as WebVitalMetric);
  });
  return null;
}
