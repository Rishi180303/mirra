import { useState, useEffect } from "react";
import CollectionGrid from "./components/CollectionGrid";
import Carousel from "./components/Carousel";
import { MSG } from "../shared/messages";

type Page = "collection" | "dressing-room";

export default function App() {
  const [page, setPage] = useState<Page>("collection");
  const [items, setItems] = useState<string[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [savedLook, setSavedLook] = useState<string | null>(null);
  const [wornIndices, setWornIndices] = useState<Set<number>>(new Set());
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

  const handleEnterDressingRoom = () => {
    setPage("dressing-room");
    setSelectedIndices(new Set());
    setResultImage(null);
    setSavedLook(null);
    setWornIndices(new Set());
    setError(null);
  };

  const handleBack = () => {
    setPage("collection");
    setResultImage(null);
    setSavedLook(null);
    setWornIndices(new Set());
    setSelectedIndices(new Set());
    setError(null);
    setLoading(false);
  };

  const handleToggle = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
    setResultImage(null);
    setError(null);
  };

  const handleSave = () => {
    if (!resultImage) return;
    setSavedLook(resultImage);
    setWornIndices(new Set(selectedIndices));
    setResultImage(null);
  };

  const handleWear = async () => {
    if (selectedIndices.size === 0) return;

    setLoading(true);
    setError(null);

    const garments = await Promise.all(
      Array.from(selectedIndices).map(async (i) => {
        const url = items[i];
        let garmentImageBase64: string | undefined;
        try {
          const img = new Image();
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
          garmentImageBase64 = canvas.toDataURL("image/jpeg", 0.92);
        } catch {
          // fallback
        }
        return { garmentImageUrl: url, garmentImageBase64 };
      })
    );

    chrome.runtime.sendMessage({
      type: MSG.TRY_ON_REQUEST,
      payload: {
        garments,
        avatarOverride: savedLook || null,
      },
    });
  };

  const displayImage = resultImage || savedLook || "avatar.png";
  const hasUnsavedResult = !!resultImage && !loading;

  // Check if current selection matches what's already worn
  const selectionMatchesWorn =
    selectedIndices.size > 0 &&
    selectedIndices.size === wornIndices.size &&
    Array.from(selectedIndices).every((i) => wornIndices.has(i));

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
            onClick={handleEnterDressingRoom}
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
      {hasUnsavedResult && (
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            className="text-[9px] tracking-[0.1em] uppercase font-light text-neutral-400 hover:text-black transition-colors duration-500"
          >
            Save look
          </button>
          <button
            onClick={() => setResultImage(null)}
            className="text-[9px] tracking-[0.1em] uppercase font-light text-neutral-400 hover:text-black transition-colors duration-500"
          >
            Discard
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <span className="text-[9px] tracking-[0.05em] font-light text-red-400">
          {error}
        </span>
      )}

      {/* Garment selector */}
      <Carousel
        items={items}
        selectedIndices={selectedIndices}
        onToggle={handleToggle}
      />

      {/* Wear it button */}
      <button
        onClick={handleWear}
        disabled={loading || selectedIndices.size === 0 || selectionMatchesWorn}
        className={`w-full py-3 text-[10px] tracking-[0.2em] uppercase transition-all duration-500 ${
          loading || selectedIndices.size === 0 || selectionMatchesWorn
            ? "text-neutral-300 cursor-default"
            : "text-black hover:tracking-[0.3em]"
        }`}
      >
        {loading
          ? "Generating..."
          : selectionMatchesWorn
            ? "Already wearing"
            : selectedIndices.size === 0
              ? "Select pieces"
              : `Wear ${selectedIndices.size === 1 ? "it" : "them"}`}
      </button>
    </div>
  );
}
