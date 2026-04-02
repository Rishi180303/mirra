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
    <div className="px-6 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1
          className="text-xs font-medium tracking-[0.3em] uppercase"
          style={{ color: "#111" }}
        >
          Mirra
        </h1>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-[10px] tracking-[0.15em] uppercase font-light text-neutral-400 hover:text-black transition-colors duration-300"
        >
          {showSettings ? "Close" : "Settings"}
        </button>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-neutral-200" />

      {/* Settings */}
      {showSettings && (
        <div className="flex flex-col gap-3">
          <span className="text-[10px] tracking-[0.15em] uppercase font-light text-neutral-400">
            Speed
          </span>
          <div className="flex gap-px">
            {(["performance", "balanced", "quality"] as SpeedMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => handleSpeedModeChange(mode)}
                className={`flex-1 text-[10px] tracking-[0.1em] uppercase py-2.5 transition-colors duration-300 border ${
                  speedMode === mode
                    ? "bg-black text-white border-black"
                    : "bg-white text-neutral-500 border-neutral-200 hover:border-black hover:text-black"
                }`}
              >
                {mode === "performance" ? "Fast" : mode === "balanced" ? "Balanced" : "Quality"}
              </button>
            ))}
          </div>
          <div className="w-full h-px bg-neutral-200 mt-2" />
        </div>
      )}

      {/* Photo */}
      <PhotoUpload personImage={personImage} onImageChange={setPersonImage} />

      {/* Garment */}
      <GarmentPreview garment={garment} />

      {/* Manual Input */}
      <ManualGarmentInput />

      {/* Try On Button */}
      <button
        onClick={handleTryOn}
        disabled={loading || !personImage || !garment}
        className="w-full py-3.5 text-[11px] tracking-[0.2em] uppercase font-medium transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed bg-black text-white hover:bg-neutral-800"
      >
        {loading ? "Generating..." : "Try It On"}
      </button>

      {/* Status */}
      <StatusBar loading={loading} error={error} />

      {/* Result */}
      <TryOnResult resultImage={resultImage} />

      {/* History */}
      <HistoryGallery />
    </div>
  );
}
