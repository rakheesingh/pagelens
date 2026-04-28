import {
  DEFAULT_SETTINGS,
  type ExtensionSettings,
  type PageMetrics,
} from "./types";

const SETTINGS_KEY = "pagelens:settings";
const METRICS_KEY_PREFIX = "pagelens:metrics:";

export async function getSettings(): Promise<ExtensionSettings> {
  const result = await chrome.storage.sync.get(SETTINGS_KEY);
  const stored = result[SETTINGS_KEY] as Partial<ExtensionSettings> | undefined;
  return { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
}

export async function setSettings(
  patch: Partial<ExtensionSettings>,
): Promise<ExtensionSettings> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await chrome.storage.sync.set({ [SETTINGS_KEY]: next });
  return next;
}

export function watchSettings(
  cb: (next: ExtensionSettings) => void,
): () => void {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: chrome.storage.AreaName,
  ) => {
    if (area !== "sync") return;
    if (!changes[SETTINGS_KEY]) return;
    const newValue = changes[SETTINGS_KEY].newValue as
      | Partial<ExtensionSettings>
      | undefined;
    cb({ ...DEFAULT_SETTINGS, ...(newValue ?? {}) });
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

function metricsKey(tabId: number): string {
  return `${METRICS_KEY_PREFIX}${tabId}`;
}

export async function setTabMetrics(
  tabId: number,
  metrics: PageMetrics,
): Promise<void> {
  await chrome.storage.session.set({ [metricsKey(tabId)]: metrics });
}

export async function getTabMetrics(
  tabId: number,
): Promise<PageMetrics | null> {
  const result = await chrome.storage.session.get(metricsKey(tabId));
  return (result[metricsKey(tabId)] as PageMetrics | undefined) ?? null;
}

export async function clearTabMetrics(tabId: number): Promise<void> {
  await chrome.storage.session.remove(metricsKey(tabId));
}
