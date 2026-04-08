export interface GarmentInfo {
  imageUrl: string;
  title?: string;
  category?: "tops" | "bottoms" | "one-pieces";
}

export interface GarmentInput {
  garmentImageUrl: string;
  garmentImageBase64?: string;
}

export interface TryOnRequest {
  garments: GarmentInput[];
  avatarOverride?: string | null;
}
