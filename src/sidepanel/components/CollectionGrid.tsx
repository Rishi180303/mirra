import { useState, useCallback } from "react";

interface Props {
  items: string[];
  onAdd: (imageUrl: string) => void;
  onRemove: (index: number) => void;
}

const MAX_ITEMS = 4;
const SEGMENT_URL = "http://localhost:8000/segment";

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

async function imageUrlToBase64(url: string): Promise<string | null> {
  try {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.92);
  } catch {
    return null;
  }
}

async function segmentImage(imageBase64: string): Promise<string | null> {
  try {
    const res = await fetch(SEGMENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageBase64 }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.image;
  } catch {
    return null;
  }
}

function FilledSlot({ image, index, onRemove }: {
  image: string;
  index: number;
  onRemove: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="aspect-[3/4] bg-neutral-50 rounded-sm overflow-hidden">
        <img
          src={image}
          alt={`Piece ${index + 1}`}
          className={`w-full h-full object-contain p-3 transition-transform duration-500 ${
            hovered ? "scale-105" : "scale-100"
          }`}
        />
      </div>
      <button
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center text-[10px] text-neutral-400 hover:text-black transition-colors duration-300"
      >
        x
      </button>
      <span className="block mt-1.5 text-[7px] tracking-[0.2em] uppercase font-light text-neutral-300 text-center">
        Piece {index + 1}
      </span>
    </div>
  );
}

function LoadingSlot() {
  return (
    <div>
      <div className="aspect-[3/4] bg-neutral-50 rounded-sm flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 border border-neutral-300 border-t-black rounded-full animate-spin" />
          <span className="text-[7px] tracking-[0.2em] uppercase font-light text-neutral-400">
            Processing
          </span>
        </div>
      </div>
    </div>
  );
}

function EmptySlot({ onDrop }: { onDrop: (url: string) => void }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const url = extractImageUrl(e);
    if (url) onDrop(url);
  }, [onDrop]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
    >
      <div
        className={`aspect-[3/4] rounded-sm flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
          dragOver
            ? "bg-neutral-100 border border-black"
            : "bg-neutral-50/50 border border-dashed border-neutral-200"
        }`}
      >
        <span className={`text-[16px] font-extralight leading-none transition-colors duration-300 ${
          dragOver ? "text-black" : "text-neutral-300"
        }`}>
          +
        </span>
        <span className={`text-[7px] tracking-[0.15em] uppercase font-light transition-colors duration-300 ${
          dragOver ? "text-black" : "text-neutral-300"
        }`}>
          {dragOver ? "Drop here" : "Add piece"}
        </span>
      </div>
    </div>
  );
}

export default function CollectionGrid({ items, onAdd, onRemove }: Props) {
  const [loadingSlots, setLoadingSlots] = useState<Set<number>>(new Set());

  const handleDrop = useCallback(async (url: string) => {
    if (items.length >= MAX_ITEMS) return;

    const slotIndex = items.length;
    setLoadingSlots((prev) => new Set(prev).add(slotIndex));

    const base64 = await imageUrlToBase64(url);
    if (base64) {
      const segmented = await segmentImage(base64);
      if (segmented) {
        onAdd(segmented);
        setLoadingSlots((prev) => { const next = new Set(prev); next.delete(slotIndex); return next; });
        return;
      }
    }

    onAdd(url);
    setLoadingSlots((prev) => { const next = new Set(prev); next.delete(slotIndex); return next; });
  }, [items.length, onAdd]);

  // Only show filled slots + one empty slot (unless maxed out)
  const showEmptySlot = items.length < MAX_ITEMS;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((img, i) => (
          <FilledSlot key={i} image={img} index={i} onRemove={() => onRemove(i)} />
        ))}
        {Array.from({ length: loadingSlots.size }).map((_, i) => (
          <LoadingSlot key={`loading-${i}`} />
        ))}
        {showEmptySlot && !loadingSlots.size && (
          <EmptySlot onDrop={handleDrop} />
        )}
      </div>
      {items.length > 0 && (
        <p className="mt-3 text-[7px] tracking-[0.1em] font-light text-neutral-300 text-center">
          {items.length} of {MAX_ITEMS} pieces selected
        </p>
      )}
    </div>
  );
}
