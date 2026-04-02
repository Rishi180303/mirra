export interface GarmentInfo {
  imageUrl: string;
  title?: string;
  category?: "tops" | "bottoms" | "one-pieces";
}

export type MessageType =
  | { type: "GARMENT_DETECTED"; payload: GarmentInfo }
  | { type: "TRY_ON_REQUEST"; payload: { personImage: string; garmentImageUrl: string; category?: string } }
  | { type: "TRY_ON_RESULT"; payload: { resultImage: string; processingTime: number } }
  | { type: "TRY_ON_ERROR"; payload: { error: string } }
  | { type: "CHECK_SERVER" }
  | { type: "SERVER_STATUS"; payload: { online: boolean } };

export interface FashnRunResponse {
  id: string;
}

export interface FashnStatusResponse {
  status: "processing" | "completed" | "failed";
  output?: string[];
  error?: string;
}

export interface TryOnHistoryItem {
  id: string;
  garmentUrl: string;
  resultImage: string;
  timestamp: number;
}
