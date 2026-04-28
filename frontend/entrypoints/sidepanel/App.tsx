import { MetricCard } from "@/components/MetricCard";
import { Toggle } from "@/components/Toggle";
import {
  formatBytes,
  formatMs,
  formatPct,
  formatVital,
} from "@/lib/format";
import { useActiveTabId, useSettings, useTabMetrics } from "@/lib/hooks";
import type { VitalMetric } from "@/lib/types";

const VITAL_ORDER: VitalMetric["name"][] = [
  "LCP",
  "INP",
  "CLS",
  "FCP",
  "TTFB",
  "FID",
];

export function App() {
  const tabId = useActiveTabId();
  const { metrics, refresh } = useTabMetrics(tabId);
  const { settings, update } = useSettings();

  const enabled = settings?.enabled ?? true;

  return (
    <div className="pl-app">
      <header className="pl-header">
        <div className="pl-header__title">
          <span
            className="pl-header__dot"
            data-disabled={enabled ? "false" : "true"}
          />
          PageLens dashboard
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Toggle
            on={enabled}
            onChange={(on) => update({ enabled: on })}
            label={enabled ? "Tracking" : "Paused"}
          />
          <button onClick={refresh}>Refresh</button>
        </div>
      </header>

      {!metrics ? (
        <div className="pl-empty">
          {enabled
            ? "No metrics yet for this tab. Reload the page or interact with it."
            : "PageLens is paused. Toggle tracking on."}
        </div>
      ) : (
        <main className="pl-stack" style={{ padding: 16 }}>
          <section>
            <div className="pl-section__title">Page</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {metrics.title || metrics.origin}
            </div>
            <div className="pl-url">{metrics.url}</div>
            <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
              <span className="pl-pill">{metrics.origin}</span>
              <span className="pl-pill">
                Updated{" "}
                {new Date(metrics.collectedAt).toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>
          </section>

          <section>
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
                  />
                );
              })}
            </div>
          </section>

          <section>
            <div className="pl-section__title">Memory</div>
            <div className="pl-grid pl-grid--3">
              <MetricCard
                label="Used JS heap"
                value={formatBytes(metrics.memory.usedJSHeapSize)}
                hint={formatPct(metrics.memory.usagePct)}
              />
              <MetricCard
                label="Total JS heap"
                value={formatBytes(metrics.memory.totalJSHeapSize)}
              />
              <MetricCard
                label="Heap limit"
                value={formatBytes(metrics.memory.jsHeapSizeLimit)}
              />
            </div>
            {metrics.memory.usagePct != null && (
              <div className="pl-bar" aria-hidden>
                <div
                  className="pl-bar__fill"
                  style={{
                    width: `${Math.min(100, metrics.memory.usagePct * 100)}%`,
                    background:
                      metrics.memory.usagePct > 0.8
                        ? "var(--pl-bad)"
                        : metrics.memory.usagePct > 0.5
                          ? "var(--pl-warn)"
                          : "var(--pl-good)",
                  }}
                />
              </div>
            )}
          </section>

          <section>
            <div className="pl-section__title">Rendering</div>
            <div className="pl-grid pl-grid--3">
              <MetricCard
                label="FPS"
                value={metrics.rendering.fps.toFixed(0)}
                hint={`${metrics.rendering.droppedFrames} dropped`}
              />
              <MetricCard
                label="Layout shifts"
                value={metrics.rendering.layoutShiftCount}
                hint={`CLS ${metrics.rendering.cumulativeLayoutShift.toFixed(3)}`}
              />
              <MetricCard
                label="Long tasks"
                value={metrics.longTasks.count}
                hint={`max ${formatMs(metrics.longTasks.longestDuration)}`}
              />
            </div>
          </section>

          {metrics.navigation && (
            <section>
              <div className="pl-section__title">Navigation timing</div>
              <table className="pl-table">
                <tbody>
                  <tr>
                    <td>DNS lookup</td>
                    <td>{formatMs(metrics.navigation.dnsLookup)}</td>
                  </tr>
                  <tr>
                    <td>TCP connect</td>
                    <td>{formatMs(metrics.navigation.tcpConnect)}</td>
                  </tr>
                  <tr>
                    <td>Request</td>
                    <td>{formatMs(metrics.navigation.request)}</td>
                  </tr>
                  <tr>
                    <td>Response</td>
                    <td>{formatMs(metrics.navigation.response)}</td>
                  </tr>
                  <tr>
                    <td>DOM interactive</td>
                    <td>{formatMs(metrics.navigation.domInteractive)}</td>
                  </tr>
                  <tr>
                    <td>DOMContentLoaded</td>
                    <td>{formatMs(metrics.navigation.domContentLoaded)}</td>
                  </tr>
                  <tr>
                    <td>DOM complete</td>
                    <td>{formatMs(metrics.navigation.domComplete)}</td>
                  </tr>
                  <tr>
                    <td>Load event</td>
                    <td>{formatMs(metrics.navigation.loadEvent)}</td>
                  </tr>
                  <tr>
                    <td>Redirects</td>
                    <td>{metrics.navigation.redirectCount}</td>
                  </tr>
                  <tr>
                    <td>Type</td>
                    <td>{metrics.navigation.type}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          )}

          <section>
            <div className="pl-section__title">
              Resources ({metrics.resources.totalResources})
            </div>
            <table className="pl-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Count</th>
                  <th>Transfer</th>
                  <th>Avg duration</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(metrics.resources.byType)
                  .sort((a, b) => b[1].transferSize - a[1].transferSize)
                  .map(([type, stats]) => (
                    <tr key={type}>
                      <td>{type}</td>
                      <td>{stats.count}</td>
                      <td>{formatBytes(stats.transferSize)}</td>
                      <td>{formatMs(stats.avgDuration)}</td>
                    </tr>
                  ))}
                <tr>
                  <td style={{ fontWeight: 600 }}>Total</td>
                  <td style={{ fontWeight: 600 }}>
                    {metrics.resources.totalResources}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {formatBytes(metrics.resources.totalTransferSize)}
                  </td>
                  <td>—</td>
                </tr>
              </tbody>
            </table>
          </section>

          {metrics.resources.slowestResources.length > 0 && (
            <section>
              <div className="pl-section__title">Slowest resources</div>
              <table className="pl-table">
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Type</th>
                    <th>Duration</th>
                    <th>Size</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.resources.slowestResources.map((r) => (
                    <tr key={r.name}>
                      <td className="truncate" title={r.name}>
                        {prettyResourceName(r.name)}
                      </td>
                      <td>{r.initiatorType}</td>
                      <td>{formatMs(r.duration)}</td>
                      <td>{formatBytes(r.transferSize)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {metrics.longTasks.recent.length > 0 && (
            <section>
              <div className="pl-section__title">Recent long tasks</div>
              <table className="pl-table">
                <thead>
                  <tr>
                    <th>Start</th>
                    <th>Duration</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {[...metrics.longTasks.recent].reverse().map((task, i) => (
                    <tr key={`${task.startTime}-${i}`}>
                      <td>{formatMs(task.startTime)}</td>
                      <td>{formatMs(task.duration)}</td>
                      <td className="truncate">
                        {task.attributionName || task.name || "self"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </main>
      )}
    </div>
  );
}

function prettyResourceName(url: string): string {
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname}`;
  } catch {
    return url;
  }
}
