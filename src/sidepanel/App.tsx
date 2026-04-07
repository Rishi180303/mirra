import { useState, useEffect } from "react";
import CollectionGrid from "./components/CollectionGrid";
import Carousel from "./components/Carousel";
import { MSG } from "../shared/messages";

type Page = "collection" | "dressing-room";

export default function App() {
  const [page, setPage] = useState<Page>("collection");
  const [items, setItems] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const listener = (message: { type: string; payload?: unknown }) => {
      if (message.type === MSG.TRY_ON_RESULT) {
        const payload = message.payload as { resultImage: string };
        setResultImage(payload.resultImage);
        setLoading(false);
      }
      if (message.type === MSG.TRY_ON_ERROR) {
        const payload = message.payload as { error: string };
        setError(payload.error);
        setLoading(false);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const handleAddItem = (url: string) => {
    if (items.length >= 4) return;
    setItems([...items, url]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleTryOn = () => {
    setPage("dressing-room");
    setSelectedIndex(0);
    setResultImage(null);
    setError(null);
  };

  const handleBack = () => {
    setPage("collection");
    setResultImage(null);
    setError(null);
    setLoading(false);
  };

  const handleWear = async () => {
    const garmentUrl = items[selectedIndex];
    if (!garmentUrl) return;

    setLoading(true);
    setError(null);

    let garmentImageBase64: string | undefined;
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load garment image"));
        img.src = garmentUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      garmentImageBase64 = canvas.toDataURL("image/jpeg", 0.92);
    } catch {
      // fallback: let background fetch directly
    }

    chrome.runtime.sendMessage({
      type: MSG.TRY_ON_REQUEST,
      payload: {
        garmentImageUrl: garmentUrl,
        garmentImageBase64,
      },
    });
  };

  const displayImage = resultImage || "avatar.png";

  // ── Collection page ──
  if (page === "collection") {
    return (
      <div className="px-6 py-8 flex flex-col gap-6">
        <span className="text-[11px] font-normal tracking-[0.35em] uppercase">
          Mirra
        </span>

        <span className="text-[9px] tracking-[0.15em] uppercase font-light text-neutral-400">
          Pick your pieces
        </span>

        <CollectionGrid
          items={items}
          onAdd={handleAddItem}
          onRemove={handleRemoveItem}
        />

        {items.length > 0 && (
          <button
            onClick={handleTryOn}
            className="w-full py-3 text-[10px] tracking-[0.2em] uppercase text-black hover:tracking-[0.3em] transition-all duration-500"
          >
            Try them on
          </button>
        )}
      </div>
    );
  }

  // ── Dressing room page ──
  return (
    <div className="px-6 py-8 flex flex-col gap-6">
      {/* Header with back */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="text-[14px] font-light text-neutral-400 hover:text-black transition-colors duration-300"
        >
          &larr;
        </button>
        <span className="text-[11px] font-normal tracking-[0.35em] uppercase">
          Mirra
        </span>
      </div>

      {/* Avatar / result */}
      <div className="relative flex justify-center">
        <img
          src={displayImage}
          alt="Avatar"
          className={`max-w-full object-contain transition-opacity duration-500 ${loading ? "opacity-40" : "opacity-100"}`}
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[9px] tracking-[0.15em] uppercase font-light text-black animate-pulse">
              Generating
            </span>
          </div>
        )}
      </div>

      {/* Result actions */}
      {resultImage && !loading && (
        <div className="flex gap-4">
          <a
            href={resultImage}
            download="mirra-result.png"
            className="text-[9px] tracking-[0.1em] uppercase font-light text-neutral-400 hover:text-black transition-colors duration-500"
          >
            Save
          </a>
          <button
            onClick={() => setResultImage(null)}
            className="text-[9px] tracking-[0.1em] uppercase font-light text-neutral-400 hover:text-black transition-colors duration-500"
          >
            Reset
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <span className="text-[9px] tracking-[0.05em] font-light text-red-400">
          {error}
        </span>
      )}

      {/* Carousel */}
      <Carousel
        items={items}
        selectedIndex={selectedIndex}
        onSelect={(i) => {
          setSelectedIndex(i);
          setResultImage(null);
          setError(null);
        }}
      />

      {/* Wear it button */}
      <button
        onClick={handleWear}
        disabled={loading}
        className={`w-full py-3 text-[10px] tracking-[0.2em] uppercase transition-all duration-500 ${
          loading
            ? "text-neutral-300 cursor-default"
            : "text-black hover:tracking-[0.3em]"
        }`}
      >
        {loading ? "Generating..." : "Wear it"}
      </button>
    </div>
  );
}
