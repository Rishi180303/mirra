import type { GarmentInfo } from "../../shared/types";

interface Props {
  garment: GarmentInfo | null;
}

export default function GarmentPreview({ garment }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-[10px] tracking-[0.15em] uppercase font-light text-neutral-400">
        Selected Garment
      </span>
      {garment ? (
        <div>
          <img
            src={garment.imageUrl}
            alt={garment.title || "Selected garment"}
            className="w-full max-h-56 object-contain"
          />
          {garment.title && (
            <p className="text-[11px] font-light text-neutral-600 mt-2 truncate">
              {garment.title}
            </p>
          )}
          {garment.category && (
            <span className="text-[9px] tracking-[0.15em] uppercase font-light text-neutral-400 mt-1 inline-block">
              {garment.category}
            </span>
          )}
        </div>
      ) : (
        <div className="py-6 text-center border border-neutral-200">
          <span className="text-[10px] tracking-[0.1em] font-light text-neutral-300">
            Browse a product page and click "Try It On"
          </span>
        </div>
      )}
    </div>
  );
}
