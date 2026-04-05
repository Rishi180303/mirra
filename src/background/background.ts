import { MSG } from "../shared/messages";
import { addToHistory } from "../shared/storage";
import { geminiTryOn } from "./gemini-provider";
import type { TryOnRequest } from "../shared/types";

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message.type === MSG.TRY_ON_REQUEST) {
    handleTryOn(message.payload as TryOnRequest);
  }
  return true;
});

async function handleTryOn(payload: TryOnRequest) {
  try {
    const result = await geminiTryOn(payload);
    await addToHistory({ garmentUrl: payload.garmentImageUrl, resultImage: result.resultImage });
    sendToSidePanel({
      type: MSG.TRY_ON_RESULT,
      payload: { resultImage: result.resultImage, processingTime: result.processingTime },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    sendToSidePanel({ type: MSG.TRY_ON_ERROR, payload: { error: errorMsg } });
  }
}

function sendToSidePanel(message: { type: string; payload?: unknown }) {
  chrome.runtime.sendMessage(message).catch(() => {});
}
