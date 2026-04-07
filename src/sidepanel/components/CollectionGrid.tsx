import { useState, useCallback } from "react";

interface Props {
  items: string[];
  onAdd: (imageUrl: string) => void;
  onRemove: (index: number) => void;
}

const MAX_ITEMS = 4;

function extractImageUrl(e: React.DragEvent): string | null {
  const url = e.dataTransfer.getData("text/uri-list");
  if (url) return url;

  const html = e.dataTransfer.getData("text/html");
  if (html) {
    const match = html.match(/src="([^"]+)"/);
    if (match?.[1]) return match[1];
  }

  const text = e.dataTransfer.getData("text/plain");
  if (text && (text.startsWith("http://") || text.startsWith("https://"))) return text;

  return null;
}

function DropSlot({ image, onDrop, onRemove }: {
  image: string | null;
  onDrop: (url: string) => void;
  onRemove: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const url = extractImageUrl(e);
    if (url) onDrop(url);
  }, [onDrop]);

  if (image) {
    return (
      <div className="relative aspect-square bg-neutral-50">
        <img src={image} alt="" className="w-full h-full object-contain" />
        <button
          onClick={onRemove}
          className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center text-[10px] text-neutral-400 hover:text-black transition-colors duration-300"
        >
          x
        </button>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      className={`aspect-square flex items-center justify-center border border-dashed transition-all duration-300 ${
        dragOver ? "border-black" : "border-neutral-200"
      }`}
    >
      <span className={`text-[8px] tracking-[0.15em] uppercase font-light transition-colors duration-300 ${
        dragOver ? "text-black" : "text-neutral-300"
      }`}>
        {dragOver ? "Drop" : "Drop item"}
      </span>
    </div>
  );
}

export default function CollectionGrid({ items, onAdd, onRemove }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {Array.from({ length: MAX_ITEMS }).map((_, i) => (
        <DropSlot
          key={i}
          image={items[i] || null}
          onDrop={(url) => onAdd(url)}
          onRemove={() => onRemove(i)}
        />
      ))}
    </div>
  );
}
