import type { MetricRating, VitalMetric } from "./types";

const VITAL_THRESHOLDS: Record<
  VitalMetric["name"],
  { good: number; poor: number; unit: "ms" | "score" }
> = {
  LCP: { good: 2500, poor: 4000, unit: "ms" },
  FCP: { good: 1800, poor: 3000, unit: "ms" },
  INP: { good: 200, poor: 500, unit: "ms" },
  FID: { good: 100, poor: 300, unit: "ms" },
  TTFB: { good: 800, poor: 1800, unit: "ms" },
  CLS: { good: 0.1, poor: 0.25, unit: "score" },
};

export function rateVital(
  name: VitalMetric["name"],
  value: number,
): MetricRating {
  const t = VITAL_THRESHOLDS[name];
  if (!t) return "unknown";
  if (value <= t.good) return "good";
  if (value <= t.poor) return "needs-improvement";
  return "poor";
}

export function formatVital(name: VitalMetric["name"], value: number): string {
  const t = VITAL_THRESHOLDS[name];
  if (!t) return value.toFixed(2);
  if (t.unit === "ms") return formatMs(value);
  return value.toFixed(3);
}

export function formatMs(ms: number): string {
  if (!Number.isFinite(ms)) return "—";
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatBytes(bytes: number | null): string {
  if (bytes == null || !Number.isFinite(bytes)) return "—";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
}

export function formatPct(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

export function ratingColor(rating: MetricRating): string {
  switch (rating) {
    case "good":
      return "#0cce6b";
    case "needs-improvement":
      return "#ffa400";
    case "poor":
      return "#ff4e42";
    default:
      return "#8a8a8a";
  }
}

export function ratingLabel(rating: MetricRating): string {
  switch (rating) {
    case "good":
      return "Good";
    case "needs-improvement":
      return "Needs work";
    case "poor":
      return "Poor";
    default:
      return "—";
  }
}
