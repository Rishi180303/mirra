export interface GarmentInfo {
  imageUrl: string;
  title?: string;
  category?: "tops" | "bottoms" | "one-pieces";
}

export interface TryOnRequest {
  garmentImageUrl: string;
  garmentImageBase64?: string;
  category?: string;
  size?: string;
}
