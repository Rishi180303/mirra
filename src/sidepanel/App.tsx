import { useState, useEffect } from "react";
import GarmentPreview from "./components/GarmentPreview";
import TryOnResult from "./components/TryOnResult";
import StatusBar from "./components/StatusBar";
import HistoryGallery from "./components/HistoryGallery";
import ManualGarmentInput from "./components/ManualGarmentInput";
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
    setResultImage(null);

    // Convert garment image to base64 in the sidepanel (avoids CORS issues in background)
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
      // If canvas approach fails (CORS), let background try fetching directly
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

  return (
    <div className="px-7 py-10 flex flex-col gap-8">
      <span className="text-[11px] font-normal tracking-[0.35em] uppercase">
        Mirra
      </span>

      <img
        src="avatar.png"
        alt="Your avatar"
        className="w-full max-h-48 object-contain"
      />

      <GarmentPreview
        garment={garment}
        onGarmentDrop={(g) => {
          setGarment(g);
          setResultImage(null);
          setError(null);
        }}
        onClear={() => setGarment(null)}
        onCategoryChange={(category) => {
          if (garment) setGarment({ ...garment, category });
        }}
      />

      <ManualGarmentInput onGarmentSelected={(g) => {
        setGarment(g);
        setResultImage(null);
        setError(null);
      }} />

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

      <StatusBar loading={loading} error={error} />
      <TryOnResult resultImage={resultImage} />
      <HistoryGallery />
    </div>
  );
}
