import { useState, useEffect, useCallback } from "react";
import BodyProfile from "./components/BodyProfile";
import GarmentPreview from "./components/GarmentPreview";
import TryOnResult from "./components/TryOnResult";
import StatusBar from "./components/StatusBar";
import HistoryGallery from "./components/HistoryGallery";
import ManualGarmentInput from "./components/ManualGarmentInput";
import { getCurrentGarment } from "../shared/storage";
import { getBestPhotoForCategory, getStoredPoses } from "../services/body-manager";
import { MSG } from "../shared/messages";
import type { GarmentInfo } from "../shared/types";

export default function App() {
  const [hasPhotos, setHasPhotos] = useState(false);
  const [garment, setGarment] = useState<GarmentInfo | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPhotoState = useCallback(async () => {
    const poses = await getStoredPoses();
    setHasPhotos(poses.length > 0);
  }, []);

  useEffect(() => {
    refreshPhotoState();
    getCurrentGarment().then((g) => g && setGarment(g as GarmentInfo));

    const listener = (message: { type: string; payload?: unknown }) => {
      if (message.type === MSG.GARMENT_DETECTED) {
        const payload = message.payload as GarmentInfo;
        setGarment(payload);
        setResultImage(null);
        setError(null);
      }
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
  }, [refreshPhotoState]);

  const handleTryOn = async () => {
    if (!garment) {
      setError("Select a garment from a product page");
      return;
    }

    const bodyPhoto = await getBestPhotoForCategory(garment.category);
    if (!bodyPhoto) {
      setError("Upload a front photo first");
      return;
    }

    setLoading(true);
    setError(null);
    setResultImage(null);

    chrome.runtime.sendMessage({
      type: MSG.TRY_ON_REQUEST,
      payload: {
        personImage: bodyPhoto.image,
        garmentImageUrl: garment.imageUrl,
        category: garment.category,
      },
    });
  };

  return (
    <div className="px-7 py-10 flex flex-col gap-8">
      {/* Header */}
      <span className="text-[11px] font-normal tracking-[0.35em] uppercase">
        Mirra
      </span>

      {/* Body Photos */}
      <BodyProfile onPhotosChange={refreshPhotoState} />

      {/* Garment */}
      <GarmentPreview garment={garment} onClear={() => {
        setGarment(null);
        chrome.storage.local.remove("currentGarment");
      }} />

      {/* Manual Input */}
      <ManualGarmentInput onGarmentSelected={(g) => {
        setGarment(g);
        setResultImage(null);
        setError(null);
      }} />

      {/* Try On Button */}
      {(hasPhotos || garment) && (
        <button
          onClick={handleTryOn}
          disabled={loading || !hasPhotos || !garment}
          className={`w-full py-3 text-[10px] tracking-[0.2em] uppercase transition-all duration-500 ${
            loading || !hasPhotos || !garment
              ? "text-neutral-300 cursor-default"
              : "text-black hover:tracking-[0.3em]"
          }`}
        >
          {loading ? "Generating..." : "Try it on"}
        </button>
      )}

      {/* Status */}
      <StatusBar loading={loading} error={error} />

      {/* Result */}
      <TryOnResult resultImage={resultImage} />

      {/* History */}
      <HistoryGallery />
    </div>
  );
}
