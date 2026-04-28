/**
 * Shared types used across content scripts, background, and UI surfaces.
 */

export type MetricRating = "good" | "needs-improvement" | "poor" | "unknown";

export interface VitalMetric {
  name: "LCP" | "FCP" | "CLS" | "INP" | "TTFB" | "FID";
  value: number;
  rating: MetricRating;
  delta?: number;
  id?: string;
  navigationType?: string;
}

export interface MemorySnapshot {
  /** All values are in bytes. `null` if performance.memory is unavailable. */
  usedJSHeapSize: number | null;
  totalJSHeapSize: number | null;
  jsHeapSizeLimit: number | null;
  /** Computed: usedJSHeapSize / jsHeapSizeLimit. */
  usagePct: number | null;
  /** ms since timeOrigin */
  capturedAt: number;
}

export interface LongTaskEntry {
  startTime: number;
  duration: number;
  name: string;
  attributionType?: string;
  attributionName?: string;
}

export interface ResourceTimingSummary {
  totalResources: number;
  totalTransferSize: number;
  totalEncodedSize: number;
  totalDecodedSize: number;
  byType: Record<
    string,
    {
      count: number;
      transferSize: number;
      avgDuration: number;
    }
  >;
  slowestResources: Array<{
    name: string;
    duration: number;
    transferSize: number;
    initiatorType: string;
  }>;
}

export interface NavigationTimingSummary {
  domContentLoaded: number;
  domComplete: number;
  loadEvent: number;
  ttfb: number;
  dnsLookup: number;
  tcpConnect: number;
  request: number;
  response: number;
  domInteractive: number;
  type: string;
  redirectCount: number;
}

export interface RenderingStats {
  /** Frames per second sampled over a rolling window. */
  fps: number;
  /** Number of dropped frames during sampling window. */
  droppedFrames: number;
  /** Layout shift count seen so far. */
  layoutShiftCount: number;
  /** Cumulative layout shift score (matches CLS). */
  cumulativeLayoutShift: number;
}

export interface PageMetrics {
  url: string;
  title: string;
  origin: string;
  collectedAt: number;
  vitals: Partial<Record<VitalMetric["name"], VitalMetric>>;
  memory: MemorySnapshot;
  longTasks: {
    count: number;
    totalDuration: number;
    longestDuration: number;
    recent: LongTaskEntry[];
  };
  resources: ResourceTimingSummary;
  navigation: NavigationTimingSummary | null;
  rendering: RenderingStats;
}

export interface ExtensionSettings {
  enabled: boolean;
  /** "demo" uses the hosted backend with shared quota; "byok" uses a user-supplied API key. */
  mode: "demo" | "byok";
  apiKey: string;
  backendUrl: string;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  mode: "demo",
  apiKey: "",
  backendUrl: "https://api.pagelens.dev",
};

/**
 * Messages exchanged between content script ↔ background ↔ UI surfaces.
 */
export type RuntimeMessage =
  | { type: "metrics:update"; tabId?: number; payload: PageMetrics }
  | { type: "metrics:request"; tabId: number }
  | { type: "metrics:response"; payload: PageMetrics | null }
  | { type: "settings:get" }
  | { type: "settings:response"; payload: ExtensionSettings }
  | { type: "settings:update"; payload: Partial<ExtensionSettings> }
  | { type: "ui:open-side-panel"; tabId: number };

/** Window-level message contract between MAIN-world injected script and ISOLATED content script. */
export interface InjectedMessage {
  source: "pagelens-injected";
  payload: PageMetrics;
}
