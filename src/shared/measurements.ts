export interface BodyMeasurements {
  height: number;       // cm
  chest: number;        // cm
  waist: number;        // cm
  hips: number;         // cm
  shoulderWidth: number; // cm
  inseam: number;       // cm
}

export interface GarmentSize {
  chest?: number;  // cm
  waist?: number;  // cm
  hips?: number;   // cm
  length?: number; // cm
}

export interface FitResult {
  area: "chest" | "waist" | "hips";
  diff: number; // positive = garment is bigger, negative = garment is smaller
  fit: "loose" | "perfect" | "snug" | "tight";
}

export function analyzeFit(body: BodyMeasurements, garment: GarmentSize): FitResult[] {
  const results: FitResult[] = [];

  const check = (area: "chest" | "waist" | "hips", bodyVal: number, garmentVal?: number) => {
    if (garmentVal === undefined) return;
    const diff = garmentVal - bodyVal;
    let fit: FitResult["fit"];
    if (diff >= 8) fit = "loose";
    else if (diff >= 3) fit = "perfect";
    else if (diff >= 0) fit = "snug";
    else fit = "tight";
    results.push({ area, diff, fit });
  };

  check("chest", body.chest, garment.chest);
  check("waist", body.waist, garment.waist);
  check("hips", body.hips, garment.hips);

  return results;
}

const STORAGE_KEY = "bodyMeasurements";

export async function getBodyMeasurements(): Promise<BodyMeasurements | null> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return (result[STORAGE_KEY] as BodyMeasurements) ?? null;
}

export async function setBodyMeasurements(m: BodyMeasurements): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: m });
}
