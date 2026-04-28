import { useState } from "react";
import { MetricCard } from "@/components/MetricCard";
import { Tabs, type TabItem } from "@/components/Tabs";
import { Toggle } from "@/components/Toggle";
import {
  formatBytes,
  formatMs,
  formatPct,
  formatVital,
} from "@/lib/format";
import { useActiveTabId, useSettings, useTabMetrics } from "@/lib/hooks";
import type { PageMetrics, VitalMetric } from "@/lib/types";

type TabId = "performance" | "memory" | "rendering";

const TABS: ReadonlyArray<TabItem<TabId>> = [
  { id: "performance", label: "Performance" },
  { id: "memory", label: "Memory" },
  { id: "rendering", label: "Rendering" },
];

const VITAL_ORDER: VitalMetric["name"][] = [
  "LCP",
  "INP",
  "CLS",
  "FCP",
  "TTFB",
];

export function App() {
  const tabId = useActiveTabId();
  const { metrics } = useTabMetrics(tabId);
  const { settings, update } = useSettings();
  const [active, setActive] = useState<TabId>("performance");

  const enabled = settings?.enabled ?? true;

  const openSidePanel = async () => {
    if (tabId == null) return;
    try {
      await chrome.runtime.sendMessage({
        type: "ui:open-side-panel",
        tabId,
      });
      window.close();
    } catch (err) {
      console.warn("[PageLens] could not open side panel", err);
    }
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <div className="pl-app" style={{ width: 360 }}>
      <header className="pl-header">
        <div className="pl-header__title">
          <span
            className="pl-header__dot"
            data-disabled={enabled ? "false" : "true"}
          />
          PageLens
        </div>
        <Toggle
          on={enabled}
          onChange={(on) => update({ enabled: on })}
          label={enabled ? "On" : "Off"}
        />
      </header>

      {metrics ? (
        <>
          <section className="pl-section">
            <div className="pl-url" title={metrics.url}>
              {metrics.url}
            </div>
          </section>

          <Tabs items={tabsWithBadges(metrics)} active={active} onChange={setActive} />

          <section className="pl-section">
            {active === "performance" && <PerformanceTab metrics={metrics} />}
            {active === "memory" && <MemoryTab metrics={metrics} />}
            {active === "rendering" && <RenderingTab metrics={metrics} />}
          </section>

          <section className="pl-section">
            <div style={{ display: "flex", gap: 8 }}>
              <button
                data-variant="primary"
                style={{ flex: 1 }}
                onClick={openSidePanel}
              >
                Open dashboard
              </button>
              <button onClick={openOptions}>Settings</button>
            </div>
          </section>
        </>
      ) : (
        <div className="pl-empty">
          {enabled
            ? "Collecting metrics… reload the page if nothing appears."
            : "PageLens is paused. Toggle on to start collecting."}
        </div>
      )}
    </div>
  );
}

function tabsWithBadges(metrics: PageMetrics): ReadonlyArray<TabItem<TabId>> {
  const poorVitals = Object.values(metrics.vitals).filter(
    (v) => v?.rating === "poor",
  ).length;
  const memoryWarn =
    metrics.memory.usagePct != null && metrics.memory.usagePct > 0.8 ? "!" : "";
  const longTasks = metrics.longTasks.count;

  return TABS.map((t) => {
    if (t.id === "performance" && poorVitals > 0) return { ...t, badge: poorVitals };
    if (t.id === "memory" && memoryWarn) return { ...t, badge: memoryWarn };
    if (t.id === "rendering" && longTasks > 0) return { ...t, badge: longTasks };
    return t;
  });
}

function PerformanceTab({ metrics }: { metrics: PageMetrics }) {
  return (
    <>
      <div className="pl-section__title">Core Web Vitals</div>
      <div className="pl-grid pl-grid--3">
        {VITAL_ORDER.map((name) => {
          const v = metrics.vitals[name];
          return (
            <MetricCard
              key={name}
              label={name}
              value={v ? formatVital(name, v.value) : "—"}
              rating={v?.rating ?? "unknown"}
              compact
            />
          );
        })}
      </div>
    </>
  );
}

function MemoryTab({ metrics }: { metrics: PageMetrics }) {
  const { memory } = metrics;
  const usagePct = memory.usagePct;
  const usageColor =
    usagePct == null
      ? "var(--pl-accent)"
      : usagePct > 0.8
        ? "var(--pl-bad)"
        : usagePct > 0.5
          ? "var(--pl-warn)"
          : "var(--pl-good)";

  return (
    <>
      <div className="pl-section__title">JS heap</div>
      <div className="pl-grid">
        <MetricCard
          label="Used"
          value={formatBytes(memory.usedJSHeapSize)}
          hint={formatPct(usagePct)}
          compact
        />
        <MetricCard
          label="Total"
          value={formatBytes(memory.totalJSHeapSize)}
          compact
        />
        <MetricCard
          label="Limit"
          value={formatBytes(memory.jsHeapSizeLimit)}
          compact
        />
        <MetricCard
          label="Resources"
          value={metrics.resources.totalResources}
          hint={formatBytes(metrics.resources.totalTransferSize)}
          compact
        />
      </div>
      {usagePct != null && (
        <div className="pl-bar" aria-label="Heap usage" aria-hidden>
          <div
            className="pl-bar__fill"
            style={{
              width: `${Math.min(100, usagePct * 100)}%`,
              background: usageColor,
            }}
          />
        </div>
      )}
      {memory.usedJSHeapSize == null && (
        <div
          style={{
            marginTop: 8,
            color: "var(--pl-fg-muted)",
            fontSize: 11,
          }}
        >
          performance.memory is unavailable on this page (Chrome only, and
          blocked on cross-origin isolated contexts).
        </div>
      )}
    </>
  );
}

function RenderingTab({ metrics }: { metrics: PageMetrics }) {
  const { rendering, longTasks } = metrics;
  return (
    <>
      <div className="pl-section__title">Rendering</div>
      <div className="pl-grid">
        <MetricCard
          label="FPS"
          value={rendering.fps.toFixed(0)}
          hint={`${rendering.droppedFrames} dropped`}
          compact
        />
        <MetricCard
          label="Layout shifts"
          value={rendering.layoutShiftCount}
          hint={`CLS ${rendering.cumulativeLayoutShift.toFixed(3)}`}
          compact
        />
        <MetricCard
          label="Long tasks"
          value={longTasks.count}
          hint={`max ${formatMs(longTasks.longestDuration)}`}
          compact
        />
        <MetricCard
          label="Total blocked"
          value={formatMs(longTasks.totalDuration)}
          hint={`${longTasks.recent.length} recent`}
          compact
        />
      </div>
    </>
  );
}
