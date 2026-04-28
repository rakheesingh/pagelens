/**
 * Page-level metric collector.
 *
 * This module runs inside the page (either as an injected MAIN-world script or
 * inside an isolated content script — both work because all of the APIs it
 * touches are standard `window`/`performance` APIs). It builds a single
 * `PageMetrics` snapshot and exposes a `subscribe()` function that fires
 * whenever any of the underlying observations changes.
 */

import {
  onCLS,
  onFCP,
  onINP,
  onLCP,
  onTTFB,
  type Metric,
} from "web-vitals";

import { rateVital } from "./format";
import type {
  LongTaskEntry,
  MemorySnapshot,
  NavigationTimingSummary,
  PageMetrics,
  RenderingStats,
  ResourceTimingSummary,
  VitalMetric,
} from "./types";

interface PerformanceMemoryShape {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

const MAX_LONG_TASKS = 25;
const MAX_SLOW_RESOURCES = 10;
const FPS_WINDOW_MS = 1000;

export type MetricsListener = (metrics: PageMetrics) => void;

export interface Collector {
  subscribe(listener: MetricsListener): () => void;
  snapshot(): PageMetrics;
  stop(): void;
}

export function startCollector(): Collector {
  const listeners = new Set<MetricsListener>();
  const vitals: PageMetrics["vitals"] = {};

  const longTasks: LongTaskEntry[] = [];
  let longTasksCount = 0;
  let longTasksTotalDuration = 0;
  let longTasksLongestDuration = 0;

  let layoutShiftCount = 0;
  let cumulativeLayoutShift = 0;

  let fps = 0;
  let droppedFrames = 0;

  const observers: PerformanceObserver[] = [];

  const emit = () => {
    const snap = snapshot();
    for (const listener of listeners) {
      try {
        listener(snap);
      } catch (err) {
        console.error("[PageLens] listener threw", err);
      }
    }
  };

  const handleVital = (metric: Metric) => {
    const name = metric.name as VitalMetric["name"];
    vitals[name] = {
      name,
      value: metric.value,
      rating: rateVital(name, metric.value),
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
    };
    emit();
  };

  onCLS(handleVital, { reportAllChanges: true });
  onFCP(handleVital);
  onINP(handleVital, { reportAllChanges: true });
  onLCP(handleVital, { reportAllChanges: true });
  onTTFB(handleVital);

  observers.push(
    safeObserve("longtask", (entries) => {
      for (const entry of entries) {
        longTasksCount += 1;
        longTasksTotalDuration += entry.duration;
        if (entry.duration > longTasksLongestDuration) {
          longTasksLongestDuration = entry.duration;
        }
        const attribution =
          (entry as PerformanceEntry & {
            attribution?: Array<{ name?: string; entryType?: string }>;
          }).attribution?.[0] ?? null;
        longTasks.push({
          startTime: entry.startTime,
          duration: entry.duration,
          name: entry.name,
          attributionType: attribution?.entryType,
          attributionName: attribution?.name,
        });
        if (longTasks.length > MAX_LONG_TASKS) {
          longTasks.splice(0, longTasks.length - MAX_LONG_TASKS);
        }
      }
      emit();
    }),
  );

  observers.push(
    safeObserve("layout-shift", (entries) => {
      for (const entry of entries) {
        const ls = entry as PerformanceEntry & {
          value: number;
          hadRecentInput: boolean;
        };
        if (ls.hadRecentInput) continue;
        layoutShiftCount += 1;
        cumulativeLayoutShift += ls.value;
      }
      emit();
    }),
  );

  let lastFrameTime = performance.now();
  let frameCount = 0;
  let windowStart = performance.now();
  let rafId = 0;

  const rafLoop = (now: number) => {
    const delta = now - lastFrameTime;
    lastFrameTime = now;
    frameCount += 1;
    if (delta > 50) {
      droppedFrames += Math.floor(delta / 16.67) - 1;
    }
    if (now - windowStart >= FPS_WINDOW_MS) {
      const elapsed = now - windowStart;
      fps = (frameCount * 1000) / elapsed;
      frameCount = 0;
      windowStart = now;
      emit();
    }
    rafId = requestAnimationFrame(rafLoop);
  };
  rafId = requestAnimationFrame(rafLoop);

  const memInterval = window.setInterval(emit, 2000);

  function snapshot(): PageMetrics {
    const navigation = readNavigation();
    const memory = readMemory();
    const resources = summariseResources();
    const rendering: RenderingStats = {
      fps,
      droppedFrames,
      layoutShiftCount,
      cumulativeLayoutShift,
    };

    return {
      url: location.href,
      title: document.title,
      origin: location.origin,
      collectedAt: Date.now(),
      vitals: { ...vitals },
      memory,
      longTasks: {
        count: longTasksCount,
        totalDuration: longTasksTotalDuration,
        longestDuration: longTasksLongestDuration,
        recent: longTasks.slice(-MAX_LONG_TASKS),
      },
      resources,
      navigation,
      rendering,
    };
  }

  function stop() {
    cancelAnimationFrame(rafId);
    window.clearInterval(memInterval);
    for (const obs of observers) {
      try {
        obs.disconnect();
      } catch {
        // observers we failed to start return undefined; safeObserve already filters.
      }
    }
    listeners.clear();
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      try {
        listener(snapshot());
      } catch (err) {
        console.error("[PageLens] subscriber threw on initial emit", err);
      }
      return () => listeners.delete(listener);
    },
    snapshot,
    stop,
  };
}

function safeObserve(
  type: string,
  cb: (entries: PerformanceEntry[]) => void,
): PerformanceObserver {
  const observer = new PerformanceObserver((list) => cb(list.getEntries()));
  try {
    observer.observe({ type, buffered: true });
  } catch (err) {
    // PerformanceObserver may not support this entry type on some browsers; we
    // still return the (idle) observer so the caller can disconnect uniformly.
    console.warn(`[PageLens] PerformanceObserver(${type}) not supported`, err);
  }
  return observer;
}

function readMemory(): MemorySnapshot {
  const mem = (performance as Performance & { memory?: PerformanceMemoryShape })
    .memory;
  if (!mem) {
    return {
      usedJSHeapSize: null,
      totalJSHeapSize: null,
      jsHeapSizeLimit: null,
      usagePct: null,
      capturedAt: performance.now(),
    };
  }
  const usagePct =
    mem.jsHeapSizeLimit > 0 ? mem.usedJSHeapSize / mem.jsHeapSizeLimit : null;
  return {
    usedJSHeapSize: mem.usedJSHeapSize,
    totalJSHeapSize: mem.totalJSHeapSize,
    jsHeapSizeLimit: mem.jsHeapSizeLimit,
    usagePct,
    capturedAt: performance.now(),
  };
}

function readNavigation(): NavigationTimingSummary | null {
  const entries = performance.getEntriesByType(
    "navigation",
  ) as PerformanceNavigationTiming[];
  const nav = entries[0];
  if (!nav) return null;
  return {
    domContentLoaded:
      nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
    domComplete: nav.domComplete,
    loadEvent: nav.loadEventEnd - nav.loadEventStart,
    ttfb: nav.responseStart - nav.requestStart,
    dnsLookup: nav.domainLookupEnd - nav.domainLookupStart,
    tcpConnect: nav.connectEnd - nav.connectStart,
    request: nav.responseStart - nav.requestStart,
    response: nav.responseEnd - nav.responseStart,
    domInteractive: nav.domInteractive,
    type: nav.type,
    redirectCount: nav.redirectCount,
  };
}

function summariseResources(): ResourceTimingSummary {
  const entries = performance.getEntriesByType(
    "resource",
  ) as PerformanceResourceTiming[];

  const byType = new Map<
    string,
    { count: number; transferSize: number; durations: number[] }
  >();

  let totalTransferSize = 0;
  let totalEncodedSize = 0;
  let totalDecodedSize = 0;

  for (const entry of entries) {
    const type = entry.initiatorType || "other";
    const bucket = byType.get(type) ?? {
      count: 0,
      transferSize: 0,
      durations: [],
    };
    bucket.count += 1;
    bucket.transferSize += entry.transferSize ?? 0;
    bucket.durations.push(entry.duration);
    byType.set(type, bucket);

    totalTransferSize += entry.transferSize ?? 0;
    totalEncodedSize += entry.encodedBodySize ?? 0;
    totalDecodedSize += entry.decodedBodySize ?? 0;
  }

  const summarisedByType: ResourceTimingSummary["byType"] = {};
  for (const [type, bucket] of byType.entries()) {
    const avg =
      bucket.durations.reduce((a, b) => a + b, 0) /
      Math.max(1, bucket.durations.length);
    summarisedByType[type] = {
      count: bucket.count,
      transferSize: bucket.transferSize,
      avgDuration: avg,
    };
  }

  const slowestResources = [...entries]
    .sort((a, b) => b.duration - a.duration)
    .slice(0, MAX_SLOW_RESOURCES)
    .map((entry) => ({
      name: entry.name,
      duration: entry.duration,
      transferSize: entry.transferSize ?? 0,
      initiatorType: entry.initiatorType || "other",
    }));

  return {
    totalResources: entries.length,
    totalTransferSize,
    totalEncodedSize,
    totalDecodedSize,
    byType: summarisedByType,
    slowestResources,
  };
}
