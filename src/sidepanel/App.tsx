import { useState, useEffect } from "react";
import PhotoUpload from "./components/PhotoUpload";
import GarmentPreview from "./components/GarmentPreview";
import TryOnResult from "./components/TryOnResult";
import StatusBar from "./components/StatusBar";
import HistoryGallery from "./components/HistoryGallery";
import ManualGarmentInput from "./components/ManualGarmentInput";
import { getPersonImage, getApiKey, setApiKey, getCurrentGarment, getSpeedMode, setSpeedMode } from "../shared/storage";
import type { SpeedMode } from "../shared/storage";
import { MSG } from "../shared/messages";
import type { GarmentInfo } from "../shared/types";

export default function App() {
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [garment, setGarment] = useState<GarmentInfo | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKeyState] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);
  const [speedMode, setSpeedModeState] = useState<SpeedMode>("balanced");

  useEffect(() => {
    getPersonImage().then(setPersonImage);
    getApiKey().then((key) => key && setApiKeyState(key));
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
    if (!apiKey) {
      setError("Enter your FASHN API key in settings");
      setShowSettings(true);
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

  const handleSaveApiKey = async () => {
    if (apiKey.trim()) {
      await setApiKey(apiKey.trim());
      setShowSettings(false);
    }
  };

  const handleSpeedModeChange = async (mode: SpeedMode) => {
    setSpeedModeState(mode);
    await setSpeedMode(mode);
  };

  const speedLabels: Record<SpeedMode, string> = {
    performance: "Fast (~5s)",
    balanced: "Balanced (~8s)",
    quality: "Quality (~15s)",
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Virtual Try-On</h1>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
        >
          {showSettings ? "Close" : "Settings"}
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white/5 rounded-lg p-3 border border-white/10 flex flex-col gap-3">
          {/* API Key */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">FASHN API Key</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKeyState(e.target.value)}
                placeholder="Enter your API key"
                className="flex-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleSaveApiKey}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1 rounded transition-colors"
              >
                Save
              </button>
            </div>
            <a
              href="https://fashn.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 inline-block"
            >
              Get an API key at fashn.ai
            </a>
          </div>

          {/* Speed Mode */}
          <div>
            <label className="text-xs text-gray-400 block mb-1">Generation Speed</label>
            <div className="flex gap-1">
              {(["performance", "balanced", "quality"] as SpeedMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleSpeedModeChange(mode)}
                  className={`flex-1 text-xs py-1.5 rounded transition-colors ${
                    speedMode === mode
                      ? "bg-indigo-600 text-white"
                      : "bg-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  {speedLabels[mode]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Your Photo */}
      <PhotoUpload personImage={personImage} onImageChange={setPersonImage} />

      {/* Selected Garment */}
      <GarmentPreview garment={garment} />

      {/* Manual Garment Input */}
      <ManualGarmentInput />

      {/* Generate Button */}
      <button
        onClick={handleTryOn}
        disabled={loading || !personImage || !garment}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 rounded-lg transition-colors text-sm"
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
