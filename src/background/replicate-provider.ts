import type { ReplicatePrediction } from "../shared/types";

const REPLICATE_API_URL = "https://api.replicate.com/v1";
const API_TOKEN = import.meta.env.VITE_REPLICATE_API_TOKEN as string;

function mapCategory(category?: string): string {
  switch (category) {
    case "tops":
      return "upper_body";
    case "bottoms":
      return "lower_body";
    case "one-pieces":
      return "dresses";
    default:
      return "upper_body";
  }
}

function garmentDescription(category?: string): string {
  switch (category) {
    case "tops":
      return "short sleeve top";
    case "bottoms":
      return "pants";
    case "one-pieces":
      return "dress";
    default:
      return "short sleeve top";
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

export async function replicateTryOn(payload: {
  personImage: string;
  garmentImageUrl: string;
  category?: string;
}): Promise<{ resultImage: string; processingTime: number }> {
  if (!API_TOKEN) {
    throw new Error("API token not set — add VITE_REPLICATE_API_TOKEN to .env");
  }

  const startTime = Date.now();

  const garm_img = await fetchImageAsBase64(payload.garmentImageUrl);
  const human_img = payload.personImage;
  const category = mapCategory(payload.category);
  const garment_des = garmentDescription(payload.category);

  const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${API_TOKEN}`,
      Prefer: "wait",
    },
    body: JSON.stringify({
      version: "906425dbca90663ff5427624839572cc56ea7d380343d13e2a4c4b09d3f0c30f",
      input: { human_img, garm_img, garment_des, category },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Replicate API error: ${response.status} ${errText}`);
  }

  let prediction: ReplicatePrediction = await response.json();

  if (prediction.status === "succeeded") {
    const output = prediction.output;
    const resultImage = Array.isArray(output) ? output[0] : output as string;
    return { resultImage, processingTime: (Date.now() - startTime) / 1000 };
  }

  // Poll for result
  const intervals = [2000, 2000, 3000, 3000, 5000];
  const timeoutMs = 180_000;
  const pollStart = Date.now();
  let attempt = 0;

  while (Date.now() - pollStart < timeoutMs) {
    const delay = intervals[Math.min(attempt, intervals.length - 1)];
    await new Promise((r) => setTimeout(r, delay));

    const pollResponse = await fetch(`${REPLICATE_API_URL}/predictions/${prediction.id}`, {
      headers: { Authorization: `Token ${API_TOKEN}` },
    });

    if (!pollResponse.ok) {
      throw new Error(`Status check failed: ${pollResponse.status}`);
    }

    prediction = await pollResponse.json();

    if (prediction.status === "succeeded") {
      const output = prediction.output;
      const resultImage = Array.isArray(output) ? output[0] : output as string;
      return { resultImage, processingTime: (Date.now() - startTime) / 1000 };
    }

    if (prediction.status === "failed" || prediction.status === "canceled") {
      throw new Error(prediction.error || `Prediction ${prediction.status}`);
    }

    attempt++;
  }

  throw new Error("Timed out waiting for Replicate result");
}
