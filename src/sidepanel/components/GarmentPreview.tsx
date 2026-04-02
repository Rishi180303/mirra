import type { GarmentInfo } from "../../shared/types";

interface Props {
  garment: GarmentInfo | null;
}

export default function GarmentPreview({ garment }: Props) {
  if (!garment) {
    return (
      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
        <label className="text-xs text-gray-400 block mb-2">Selected Garment</label>
        <div className="text-center py-4 text-xs text-gray-500">
          Browse a clothing product page and click "Try It On"
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
      <label className="text-xs text-gray-400 block mb-2">Selected Garment</label>
      <img
        src={garment.imageUrl}
        alt={garment.title || "Selected garment"}
        className="w-full max-h-48 object-contain rounded"
      />
      {garment.title && (
        <p className="text-xs text-gray-300 mt-2 truncate">{garment.title}</p>
      )}
      {garment.category && (
        <span className="inline-block text-[10px] bg-indigo-600/30 text-indigo-300 px-2 py-0.5 rounded mt-1">
          {garment.category}
        </span>
      )}
    </div>
  );
}
