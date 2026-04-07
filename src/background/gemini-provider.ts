const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = "gemini-3-pro-image-preview";
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

function buildPrompt(): string {
  return [
    "I'm providing two images.",
    "Image 1 is a person (my avatar).",
    "Image 2 is a clothing item I want to try on.",
    "",
    "Generate a NEW photo of the EXACT same person from Image 1 wearing the EXACT clothing item from Image 2.",
    "",
    "STRICT RULES:",
    "- The person's face, skin tone, hair, body shape, and pose must be IDENTICAL to Image 1. Do not change the person at all.",
    "- Copy every detail of the clothing from Image 2 EXACTLY: fabric, color, texture, buttons, collar, pockets, pattern, sleeve length, stitching. Do NOT simplify, substitute, or reimagine the garment.",
    "- Full body shot from head to toe, straight-on camera angle.",
    "- Clean white studio background with professional fashion photography lighting.",
    "- Output ONE single photorealistic image. No collage, no split screen, no text, no watermarks.",
  ].join("\n");
}

function stripDataUrlPrefix(dataUrl: string): { mimeType: string; data: string } {
  const match = dataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (match) return { mimeType: match[1], data: match[2] };
  return { mimeType: "image/jpeg", data: dataUrl };
}

async function fetchImageAsBase64(url: string): Promise<{ mimeType: string; data: string }> {
  if (url.startsWith("data:")) return stripDataUrlPrefix(url);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Image fetch failed: ${response.status}`);
  const blob = await response.blob();
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return { mimeType: blob.type || "image/jpeg", data: btoa(binary) };
}

const SEGMENT_URL = "http://localhost:8000/segment";

async function trySegment(
  garment: { mimeType: string; data: string }
): Promise<{ mimeType: string; data: string } | null> {
  try {
    const dataUrl = `data:${garment.mimeType};base64,${garment.data}`;
    const res = await fetch(SEGMENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: dataUrl }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return stripDataUrlPrefix(json.image);
  } catch {
    // Server not running — fall back to raw image
    return null;
  }
}

export async function geminiTryOn(payload: {
  garmentImageUrl: string;
  garmentImageBase64?: string;
  category?: string;
  size?: string;
}): Promise<{ resultImage: string; processingTime: number }> {
  if (!API_KEY) {
    throw new Error("API key not set — add VITE_GEMINI_API_KEY to .env");
  }

  const startTime = Date.now();

  // Load avatar from extension assets
  const avatarUrl = chrome.runtime.getURL("avatar.png");
  const avatar = await fetchImageAsBase64(avatarUrl);

  // Use pre-converted base64 from sidepanel if available
  const garmentSource = payload.garmentImageBase64 || payload.garmentImageUrl;
  let garment = await fetchImageAsBase64(garmentSource);

  // Try segmentation server for cleaner garment image
  garment = await trySegment(garment) || garment;

  const response = await fetch(`${GEMINI_API_URL}/${MODEL}:generateContent?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: buildPrompt() },
          { inline_data: { mime_type: avatar.mimeType, data: avatar.data } },
          { inline_data: { mime_type: garment.mimeType, data: garment.data } },
        ],
      }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: "3:4",
          imageSize: "2K",
        },
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errText}`);
  }

  const result = await response.json();

  const candidate = result.candidates?.[0];
  if (!candidate) {
    const blockReason = result.promptFeedback?.blockReason;
    throw new Error(blockReason ? `Blocked by safety filter: ${blockReason}` : `No result from Gemini: ${JSON.stringify(result).slice(0, 500)}`);
  }

  // Gemini responds with camelCase (inlineData) not snake_case (inline_data)
  const parts = candidate.content?.parts || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const imagePart = parts.find((p: any) => p.inlineData || p.inline_data);
  const imageData = imagePart?.inlineData || imagePart?.inline_data;
  if (!imageData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text).join(" ");
    throw new Error(`No image generated. Model said: ${textParts || JSON.stringify(candidate).slice(0, 500)}`);
  }

  const mimeType = imageData.mimeType || imageData.mime_type;
  const resultImage = `data:${mimeType};base64,${imageData.data}`;
  return { resultImage, processingTime: (Date.now() - startTime) / 1000 };
}
