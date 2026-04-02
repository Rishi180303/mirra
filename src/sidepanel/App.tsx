import { useState, useEffect } from "react";
import PhotoUpload from "./components/PhotoUpload";
import GarmentPreview from "./components/GarmentPreview";
import TryOnResult from "./components/TryOnResult";
import StatusBar from "./components/StatusBar";
import HistoryGallery from "./components/HistoryGallery";
import ManualGarmentInput from "./components/ManualGarmentInput";
import { getPersonImage, getCurrentGarment, getSpeedMode, setSpeedMode } from "../shared/storage";
import type { SpeedMode } from "../shared/storage";
import { MSG } from "../shared/messages";
import type { GarmentInfo } from "../shared/types";

export default function App() {
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [garment, setGarment] = useState<GarmentInfo | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [speedMode, setSpeedModeState] = useState<SpeedMode>("balanced");

  useEffect(() => {
    getPersonImage().then(setPersonImage);
    getCurrentGarment().then((g) => g && setGarment(g as GarmentInfo));
    getSpeedMode().then(setSpeedModeState);

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
  }, []);

  const handleTryOn = async () => {
    if (!personImage) {
      setError("Upload your photo first");
      return;
    }
    if (!garment) {
      setError("Select a garment from a product page");
      return;
    }

    setLoading(true);
    setError(null);
    setResultImage(null);

    chrome.runtime.sendMessage({
      type: MSG.TRY_ON_REQUEST,
      payload: {
        personImage,
        garmentImageUrl: garment.imageUrl,
        category: garment.category,
      },
    });
  };

  const handleSpeedModeChange = async (mode: SpeedMode) => {
    setSpeedModeState(mode);
    await setSpeedMode(mode);
  };

  return (
    <div className="px-7 py-10 flex flex-col gap-10">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-normal tracking-[0.35em] uppercase">
          Mirra
        </span>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-[9px] tracking-[0.12em] uppercase font-light text-neutral-400 hover:text-neutral-600 transition-colors duration-500"
        >
          {showSettings ? "Close" : "Settings"}
        </button>
      </div>

      {/* Settings */}
      {showSettings && (
        <>
          <div className="flex gap-0">
            {(["performance", "balanced", "quality"] as SpeedMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => handleSpeedModeChange(mode)}
                className={`flex-1 text-[9px] tracking-[0.08em] uppercase py-2 transition-all duration-500 ${
                  speedMode === mode
                    ? "text-black"
                    : "text-neutral-400 hover:text-neutral-500"
                }`}
              >
                {mode === "performance" ? "Fast" : mode === "balanced" ? "Balanced" : "Quality"}
              </button>
            ))}
          </div>
          <div className="w-full h-px bg-neutral-100" />
        </>
      )}

      {/* Photo + Garment */}
      <PhotoUpload personImage={personImage} onImageChange={setPersonImage} />
      <GarmentPreview garment={garment} />

      {/* Action */}
      {(personImage || garment) && (
        <button
          onClick={handleTryOn}
          disabled={loading || !personImage || !garment}
          className={`w-full py-3 text-[10px] tracking-[0.2em] uppercase transition-all duration-500 ${
            loading || !personImage || !garment
              ? "text-neutral-400 cursor-default"
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

      {/* Manual + History at bottom */}
      <div className="mt-auto flex flex-col gap-6">
        <ManualGarmentInput />
        <HistoryGallery />
      </div>
    </div>
  );
}
