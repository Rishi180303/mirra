import { useState, useCallback } from "react";
import type { GarmentInfo } from "../../shared/types";

interface Props {
  garment: GarmentInfo | null;
  onGarmentDrop: (garment: GarmentInfo) => void;
  onClear: () => void;
  onCategoryChange: (category: GarmentInfo["category"]) => void;
}

const CATEGORIES: { value: GarmentInfo["category"]; label: string }[] = [
  { value: "tops", label: "Top" },
  { value: "bottoms", label: "Bottom" },
  { value: "one-pieces", label: "Dress" },
];

export default function GarmentPreview({ garment, onGarmentDrop, onClear, onCategoryChange }: Props) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const url = e.dataTransfer.getData("text/uri-list");
    if (url) {
      onGarmentDrop({ imageUrl: url });
      return;
    }

    const html = e.dataTransfer.getData("text/html");
    if (html) {
      const match = html.match(/src="([^"]+)"/);
      if (match?.[1]) {
        onGarmentDrop({ imageUrl: match[1] });
        return;
      }
    }

    const text = e.dataTransfer.getData("text/plain");
    if (text && (text.startsWith("http://") || text.startsWith("https://"))) {
      onGarmentDrop({ imageUrl: text });
    }
  }, [onGarmentDrop]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  if (!garment) {
    return (
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`py-16 text-center transition-all duration-300 border border-dashed ${
          dragOver ? "border-black" : "border-neutral-200"
        }`}
      >
        <span className={`text-[9px] tracking-[0.15em] uppercase font-light transition-colors duration-300 ${
          dragOver ? "text-black" : "text-neutral-400"
        }`}>
          {dragOver ? "Drop garment" : "Drag a garment image here"}
        </span>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <img
        src={garment.imageUrl}
        alt={garment.title || "Garment"}
        className="w-full max-h-60 object-contain"
      />
      <div className="flex items-center gap-4 mt-3">
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
      <div className="flex gap-2 mt-3">
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onCategoryChange(value)}
            className={`flex-1 py-1.5 text-[8px] tracking-[0.15em] uppercase transition-all duration-300 ${
              garment.category === value
                ? "text-black border-b border-black"
                : "text-neutral-300 hover:text-neutral-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
