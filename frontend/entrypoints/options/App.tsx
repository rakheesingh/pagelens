import { useState } from "react";
import { Toggle } from "@/components/Toggle";
import { useSettings } from "@/lib/hooks";

export function App() {
  const { settings, update } = useSettings();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  if (!settings) {
    return <div className="pl-empty">Loading…</div>;
  }

  const onSave = async (patch: Parameters<typeof update>[0]) => {
    await update(patch);
    setSavedAt(Date.now());
  };

  return (
    <div
      className="pl-app"
      style={{ maxWidth: 640, margin: "0 auto", padding: "32px 24px" }}
    >
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>PageLens settings</h1>
        <p style={{ color: "var(--pl-fg-muted)", marginTop: 4 }}>
          Control how PageLens collects metrics and which backend it talks to.
        </p>
      </header>

      <section className="pl-section" style={{ borderRadius: 12 }}>
        <div className="pl-row">
          <div>
            <div style={{ fontWeight: 600 }}>Tracking enabled</div>
            <div style={{ color: "var(--pl-fg-muted)", fontSize: 12 }}>
              When off, PageLens stops collecting metrics on every page.
            </div>
          </div>
          <Toggle
            on={settings.enabled}
            onChange={(on) => onSave({ enabled: on })}
          />
        </div>
      </section>

      <section className="pl-section" style={{ borderRadius: 12 }}>
        <div className="pl-section__title">Analysis backend</div>
        <div className="pl-stack">
          <label className="pl-row" style={{ alignItems: "flex-start" }}>
            <input
              type="radio"
              name="mode"
              checked={settings.mode === "demo"}
              onChange={() => onSave({ mode: "demo" })}
              style={{ width: "auto", marginTop: 3 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>Demo mode</div>
              <div style={{ color: "var(--pl-fg-muted)", fontSize: 12 }}>
                Use the hosted PageLens backend with a shared rate limit. Great
                for trying things out — no API key needed.
              </div>
            </div>
          </label>
          <label className="pl-row" style={{ alignItems: "flex-start" }}>
            <input
              type="radio"
              name="mode"
              checked={settings.mode === "byok"}
              onChange={() => onSave({ mode: "byok" })}
              style={{ width: "auto", marginTop: 3 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>Bring your own key</div>
              <div style={{ color: "var(--pl-fg-muted)", fontSize: 12 }}>
                Send your own API key with every request — no shared quota.
              </div>
            </div>
          </label>
        </div>

        {settings.mode === "byok" && (
          <div style={{ marginTop: 12 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                color: "var(--pl-fg-muted)",
                marginBottom: 4,
              }}
            >
              API key
            </label>
            <input
              type="password"
              value={settings.apiKey}
              placeholder="pl_…"
              onChange={(e) => onSave({ apiKey: e.target.value })}
            />
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "var(--pl-fg-muted)",
              marginBottom: 4,
            }}
          >
            Backend URL
          </label>
          <input
            type="url"
            value={settings.backendUrl}
            onChange={(e) => onSave({ backendUrl: e.target.value })}
          />
        </div>
      </section>

      <section className="pl-section" style={{ borderRadius: 12 }}>
        <div className="pl-section__title">About</div>
        <p style={{ color: "var(--pl-fg-soft)", margin: 0 }}>
          PageLens v0.1.0 — MVP. Metrics are collected locally in your browser
          and sent to the configured backend only when you trigger an analysis.
        </p>
      </section>

      {savedAt && (
        <div
          style={{
            marginTop: 16,
            color: "var(--pl-good)",
            fontSize: 12,
          }}
        >
          Saved {new Date(savedAt).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
