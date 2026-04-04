import type { GarmentInfo } from "../../shared/types";

interface Props {
  garment: GarmentInfo | null;
  onClear: () => void;
}

export default function GarmentPreview({ garment, onClear }: Props) {
  if (!garment) return null;

  return (
    <div>
      <img
        src={garment.imageUrl}
        alt={garment.title || "Garment"}
        className="w-full max-h-60 object-contain"
      />
      <div className="flex gap-6 mt-3">
        {garment.title && (
          <p className="text-[10px] font-light text-neutral-400 truncate flex-1">
            {garment.title}
          </p>
        )}
        <button
          onClick={onClear}
          className="text-[9px] tracking-[0.1em] uppercase font-light text-neutral-400 hover:text-black transition-colors duration-500"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
