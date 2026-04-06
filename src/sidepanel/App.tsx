import { useState, useEffect } from "react";
import GarmentPreview from "./components/GarmentPreview";
import { MSG } from "../shared/messages";
import type { GarmentInfo } from "../shared/types";

export default function App() {
  const [garment, setGarment] = useState<GarmentInfo | null>(null);
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

  const handleTryOn = async () => {
    if (!garment) return;

    setLoading(true);
    setError(null);

    let garmentImageBase64: string | undefined;
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load garment image"));
        img.src = garment.imageUrl;
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
        garmentImageUrl: garment.imageUrl,
        garmentImageBase64,
        category: garment.category,
      },
    });
  };

  const displayImage = resultImage || "avatar.png";

  return (
    <div className="px-6 py-8 flex flex-col items-center gap-6">
      {/* Header */}
      <span className="text-[11px] font-normal tracking-[0.35em] uppercase self-start">
        Mirra
      </span>

      {/* Main image — avatar swaps to result in-place */}
      <div className="relative w-full flex justify-center">
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
        <div className="flex gap-4 self-start">
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
        <span className="text-[9px] tracking-[0.05em] font-light text-red-400 self-start">
          {error}
        </span>
      )}

      {/* Garment drop zone + preview */}
      <div className="w-full">
        <GarmentPreview
          garment={garment}
          onGarmentDrop={(g) => {
            setGarment(g);
            setResultImage(null);
            setError(null);
          }}
          onClear={() => {
            setGarment(null);
            setResultImage(null);
          }}
          onCategoryChange={(category) => {
            if (garment) setGarment({ ...garment, category });
          }}
        />
      </div>

      {/* Try On button */}
      {garment && (
        <button
          onClick={handleTryOn}
          disabled={loading}
          className={`w-full py-3 text-[10px] tracking-[0.2em] uppercase transition-all duration-500 ${
            loading
              ? "text-neutral-300 cursor-default"
              : "text-black hover:tracking-[0.3em]"
          }`}
        >
          {loading ? "Generating..." : "Try it on"}
        </button>
      )}
    </div>
  );
}
