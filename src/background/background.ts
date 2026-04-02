import { MSG } from "../shared/messages";
import { getApiKey, getSpeedMode, setCurrentGarment, addToHistory } from "../shared/storage";
import type { FashnRunResponse, FashnStatusResponse } from "../shared/types";

const FASHN_API_URL = "https://api.fashn.ai/v1";

// Open side panel when extension icon is clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === MSG.GARMENT_DETECTED) {
    // Store garment and forward to side panel
    setCurrentGarment(message.payload);
    // Forward to all extension pages (side panel)
    chrome.runtime.sendMessage(message).catch(() => {
      // Side panel might not be open yet — that's fine
    });
  }

  if (message.type === MSG.TRY_ON_REQUEST) {
    handleTryOn(message.payload, sender.tab?.id);
  }

  return true;
});

async function handleTryOn(
  payload: { personImage: string; garmentImageUrl: string; category?: string },
  tabId?: number
) {
  const startTime = Date.now();

  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      sendToSidePanel({ type: MSG.TRY_ON_ERROR, payload: { error: "API key not set" } });
      return;
    }

    // Fetch garment image and convert to base64
    const garmentBase64 = await fetchImageAsBase64(payload.garmentImageUrl);

    // Get speed mode preference
    const mode = await getSpeedMode();

    // Start FASHN prediction
    const runResponse = await fetch(`${FASHN_API_URL}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model_image: payload.personImage,
        garment_image: garmentBase64,
        category: payload.category || "auto",
        mode,
      }),
    });

    if (!runResponse.ok) {
      const errText = await runResponse.text();
      throw new Error(`FASHN API error: ${runResponse.status} ${errText}`);
    }

    const runData: FashnRunResponse = await runResponse.json();
    const predictionId = runData.id;

    // Poll for result
    const result = await pollForResult(apiKey, predictionId);

    if (result.status === "completed" && result.output?.[0]) {
      const resultImage = result.output[0];
      const processingTime = (Date.now() - startTime) / 1000;

      // Save to history
      await addToHistory({
        garmentUrl: payload.garmentImageUrl,
        resultImage,
      });

      sendToSidePanel({
        type: MSG.TRY_ON_RESULT,
        payload: { resultImage, processingTime },
      });
    } else {
      throw new Error(result.error || "Try-on failed");
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    sendToSidePanel({ type: MSG.TRY_ON_ERROR, payload: { error: errorMsg } });
  }
}

async function fetchImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function pollForResult(
  apiKey: string,
  predictionId: string,
  timeoutMs = 180_000
): Promise<FashnStatusResponse> {
  const intervals = [2000, 2000, 3000, 3000, 5000]; // escalating poll intervals
  const startTime = Date.now();
  let attempt = 0;

  while (Date.now() - startTime < timeoutMs) {
    const delay = intervals[Math.min(attempt, intervals.length - 1)];
    await new Promise((r) => setTimeout(r, delay));

    const response = await fetch(`${FASHN_API_URL}/status/${predictionId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    const data: FashnStatusResponse = await response.json();

    if (data.status === "completed" || data.status === "failed") {
      return data;
    }

    attempt++;
  }

  throw new Error("Timed out waiting for result");
}

function sendToSidePanel(message: { type: string; payload?: unknown }) {
  chrome.runtime.sendMessage(message).catch(() => {
    // Side panel might be closed
  });
}
