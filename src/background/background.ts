import { MSG } from "../shared/messages";
import { setCurrentGarment, addToHistory, getActiveProvider } from "../shared/storage";
import { replicateTryOn } from "./replicate-provider";
import { fashnTryOn } from "./fashn-provider";
import type { TryOnProvider } from "../shared/types";

const PROVIDERS: Record<TryOnProvider, typeof replicateTryOn> = {
  replicate: replicateTryOn,
  fashn: fashnTryOn,
};

const FALLBACK: Record<TryOnProvider, TryOnProvider> = {
  replicate: "fashn",
  fashn: "replicate",
};

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message.type === MSG.GARMENT_DETECTED) {
    setCurrentGarment(message.payload);
    chrome.runtime.sendMessage(message).catch(() => {});
  }

  if (message.type === MSG.TRY_ON_REQUEST) {
    handleTryOn(message.payload);
  }

  return true;
});

async function handleTryOn(payload: {
  personImage: string;
  garmentImageUrl: string;
  category?: string;
}) {
  const activeProvider = await getActiveProvider();
  const tryOn = PROVIDERS[activeProvider];
  const fallbackProvider = FALLBACK[activeProvider];
  const fallbackTryOn = PROVIDERS[fallbackProvider];

  try {
    const result = await tryOn(payload);
    await addToHistory({ garmentUrl: payload.garmentImageUrl, resultImage: result.resultImage });
    sendToSidePanel({
      type: MSG.TRY_ON_RESULT,
      payload: { resultImage: result.resultImage, processingTime: result.processingTime, provider: activeProvider },
    });
  } catch (primaryErr) {
    console.warn(`${activeProvider} failed, trying ${fallbackProvider}:`, primaryErr);
    try {
      const result = await fallbackTryOn(payload);
      await addToHistory({ garmentUrl: payload.garmentImageUrl, resultImage: result.resultImage });
      sendToSidePanel({
        type: MSG.TRY_ON_RESULT,
        payload: { resultImage: result.resultImage, processingTime: result.processingTime, provider: fallbackProvider },
      });
    } catch (fallbackErr) {
      const errorMsg = fallbackErr instanceof Error ? fallbackErr.message : "Unknown error";
      sendToSidePanel({ type: MSG.TRY_ON_ERROR, payload: { error: errorMsg } });
    }
  }
}

function sendToSidePanel(message: { type: string; payload?: unknown }) {
  chrome.runtime.sendMessage(message).catch(() => {});
}
