import { useEffect, useState } from "react";
import {
  getSettings,
  getTabMetrics,
  setSettings,
  watchSettings,
} from "./storage";
import type {
  ExtensionSettings,
  PageMetrics,
  RuntimeMessage,
} from "./types";

/** Returns the active tab id (window-scoped). */
export function useActiveTabId(): number | null {
  const [tabId, setTabId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          lastFocusedWindow: true,
        });
        if (!cancelled) setTabId(tab?.id ?? null);
      } catch (err) {
        console.warn("[PageLens] could not query active tab", err);
      }
    };
    void load();

    const handleActivated = () => void load();
    const handleUpdated = (
      _id: number,
      changeInfo: chrome.tabs.OnUpdatedInfo,
    ) => {
      if (changeInfo.status === "complete" || changeInfo.url) void load();
    };
    chrome.tabs.onActivated.addListener(handleActivated);
    chrome.tabs.onUpdated.addListener(handleUpdated);
    return () => {
      cancelled = true;
      chrome.tabs.onActivated.removeListener(handleActivated);
      chrome.tabs.onUpdated.removeListener(handleUpdated);
    };
  }, []);

  return tabId;
}

export function useTabMetrics(tabId: number | null): {
  metrics: PageMetrics | null;
  refresh: () => void;
} {
  const [metrics, setMetrics] = useState<PageMetrics | null>(null);

  const refresh = () => {
    if (tabId == null) return;
    void getTabMetrics(tabId).then((m) => setMetrics(m));
  };

  useEffect(() => {
    if (tabId == null) return;
    refresh();

    const listener = (message: RuntimeMessage) => {
      if (message.type === "metrics:update" || message.type === "metrics:response") {
        if (message.type === "metrics:update") {
          if (message.tabId != null && message.tabId !== tabId) return;
          setMetrics(message.payload);
        } else if (message.payload) {
          setMetrics(message.payload);
        }
      }
    };
    chrome.runtime.onMessage.addListener(listener);

    const interval = window.setInterval(refresh, 2000);

    return () => {
      chrome.runtime.onMessage.removeListener(listener);
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabId]);

  return { metrics, refresh };
}

export function useSettings(): {
  settings: ExtensionSettings | null;
  update: (patch: Partial<ExtensionSettings>) => Promise<void>;
} {
  const [settings, setLocal] = useState<ExtensionSettings | null>(null);

  useEffect(() => {
    void getSettings().then(setLocal);
    const stop = watchSettings(setLocal);
    return stop;
  }, []);

  const update = async (patch: Partial<ExtensionSettings>) => {
    const next = await setSettings(patch);
    setLocal(next);
  };

  return { settings, update };
}
