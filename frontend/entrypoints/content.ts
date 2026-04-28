import { startCollector } from "@/lib/collector";
import { getSettings, watchSettings } from "@/lib/storage";
import type { PageMetrics, RuntimeMessage } from "@/lib/types";

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_start",
  allFrames: false,
  async main() {
    let stop: (() => void) | null = null;

    const start = () => {
      if (stop) return;
      const collector = startCollector();
      const unsubscribe = collector.subscribe((metrics) => {
        sendUpdate(metrics);
      });
      stop = () => {
        unsubscribe();
        collector.stop();
      };
    };

    const halt = () => {
      stop?.();
      stop = null;
    };

    const settings = await getSettings();
    if (settings.enabled) start();

    watchSettings((next) => {
      if (next.enabled) start();
      else halt();
    });

    window.addEventListener("pagehide", halt, { once: true });
  },
});

function sendUpdate(payload: PageMetrics) {
  const message: RuntimeMessage = { type: "metrics:update", payload };
  try {
    chrome.runtime.sendMessage(message).catch(() => {
      // Background may be inactive while we're sending; safe to ignore.
    });
  } catch {
    // chrome.runtime can be unavailable during teardown.
  }
}
