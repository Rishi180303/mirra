import type { GarmentInfo } from "../../shared/types";

interface Props {
  garment: GarmentInfo | null;
}

export default function GarmentPreview({ garment }: Props) {
  if (!garment) return null;

  return (
    <div>
      <img
        src={garment.imageUrl}
        alt={garment.title || "Garment"}
        className="w-full max-h-60 object-contain"
      />
      {garment.title && (
        <p className="text-[10px] font-light text-neutral-400 mt-3 truncate">
          {garment.title}
        </p>
      )}
    </div>
  );
}
