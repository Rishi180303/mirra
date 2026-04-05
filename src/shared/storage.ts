const KEYS = {
  HISTORY: "tryOnHistory",
} as const;

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
  await chrome.storage.local.set({ [KEYS.HISTORY]: history.slice(0, 20) });
}
