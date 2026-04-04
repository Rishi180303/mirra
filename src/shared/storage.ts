import type { TryOnProvider } from "./types";

const KEYS = {
  HISTORY: "tryOnHistory",
  GARMENT: "currentGarment",
  SPEED_MODE: "speedMode",
  ACTIVE_PROVIDER: "activeProvider",
} as const;

export type SpeedMode = "performance" | "balanced" | "quality";

export async function getSpeedMode(): Promise<SpeedMode> {
  const result = await chrome.storage.sync.get(KEYS.SPEED_MODE);
  return (result[KEYS.SPEED_MODE] as SpeedMode) ?? "balanced";
}

export async function setSpeedMode(mode: SpeedMode): Promise<void> {
  await chrome.storage.sync.set({ [KEYS.SPEED_MODE]: mode });
}

export async function getCurrentGarment(): Promise<{ imageUrl: string; title?: string } | null> {
  const result = await chrome.storage.local.get(KEYS.GARMENT);
  return (result[KEYS.GARMENT] as { imageUrl: string; title?: string }) ?? null;
}

export async function setCurrentGarment(garment: { imageUrl: string; title?: string }): Promise<void> {
  await chrome.storage.local.set({ [KEYS.GARMENT]: garment });
}

export async function getHistory(): Promise<Array<{ id: string; garmentUrl: string; resultImage: string; timestamp: number }>> {
  const result = await chrome.storage.local.get(KEYS.HISTORY);
  return (result[KEYS.HISTORY] as Array<{ id: string; garmentUrl: string; resultImage: string; timestamp: number }>) ?? [];
}

export async function addToHistory(item: { garmentUrl: string; resultImage: string }): Promise<void> {
  const history = await getHistory();
  history.unshift({
    id: crypto.randomUUID(),
    ...item,
    timestamp: Date.now(),
  });
  // Keep last 20 results
  await chrome.storage.local.set({ [KEYS.HISTORY]: history.slice(0, 20) });
}

export async function getActiveProvider(): Promise<TryOnProvider> {
  const result = await chrome.storage.sync.get(KEYS.ACTIVE_PROVIDER);
  return (result[KEYS.ACTIVE_PROVIDER] as TryOnProvider) ?? "replicate";
}

export async function setActiveProvider(provider: TryOnProvider): Promise<void> {
  await chrome.storage.sync.set({ [KEYS.ACTIVE_PROVIDER]: provider });
}
