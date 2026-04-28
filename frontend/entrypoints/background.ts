import {
  clearTabMetrics,
  getSettings,
  getTabMetrics,
  setTabMetrics,
} from "@/lib/storage";
import type { PageMetrics, RuntimeMessage } from "@/lib/types";

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(async () => {
    await getSettings();
  });

  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: false })
      .catch((err) => console.warn("[PageLens] sidePanel behavior failed", err));
  }

  chrome.tabs.onRemoved.addListener((tabId) => {
    void clearTabMetrics(tabId);
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === "loading") {
      void clearTabMetrics(tabId);
    }
  });

  chrome.runtime.onMessage.addListener(
    (
      message: RuntimeMessage,
      sender,
      sendResponse: (response?: unknown) => void,
    ) => {
      void handleMessage(message, sender).then(sendResponse).catch((err) => {
        console.error("[PageLens] background message handler failed", err);
        sendResponse({ ok: false, error: String(err) });
      });
      return true;
    },
  );

  chrome.action.onClicked.addListener(async (tab) => {
    if (!tab.id) return;
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
    } catch (err) {
      console.warn("[PageLens] failed to open side panel", err);
    }
  });
});

async function handleMessage(
  message: RuntimeMessage,
  sender: chrome.runtime.MessageSender,
): Promise<unknown> {
  switch (message.type) {
    case "metrics:update": {
      const tabId = message.tabId ?? sender.tab?.id;
      if (typeof tabId !== "number") return { ok: false };
      await setTabMetrics(tabId, message.payload satisfies PageMetrics);
      try {
        chrome.runtime.sendMessage({
          type: "metrics:response",
          payload: message.payload,
        });
      } catch {
        // No UI listener open; that's fine.
      }
      return { ok: true };
    }
    case "metrics:request": {
      const metrics = await getTabMetrics(message.tabId);
      return { type: "metrics:response", payload: metrics };
    }
    case "settings:get": {
      const settings = await getSettings();
      return { type: "settings:response", payload: settings };
    }
    case "ui:open-side-panel": {
      try {
        await chrome.sidePanel.open({ tabId: message.tabId });
        return { ok: true };
      } catch (err) {
        return { ok: false, error: String(err) };
      }
    }
    default:
      return { ok: false, error: "unknown message" };
  }
}
