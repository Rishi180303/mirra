import { useState } from "react";
import { MSG } from "../../shared/messages";

export default function ManualGarmentInput() {
  const [url, setUrl] = useState("");
  const [show, setShow] = useState(false);

  const handleSubmit = () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    chrome.runtime.sendMessage({
      type: MSG.GARMENT_DETECTED,
      payload: {
        imageUrl: trimmed,
        title: "Manual input",
      },
    });
    setUrl("");
    setShow(false);
  };

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        Or paste a garment image URL
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder="Paste garment image URL..."
        className="flex-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500"
        autoFocus
      />
      <button
        onClick={handleSubmit}
        disabled={!url.trim()}
        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 text-white text-xs px-2 py-1 rounded transition-colors"
      >
        Use
      </button>
      <button
        onClick={() => setShow(false)}
        className="text-xs text-gray-500 hover:text-gray-300 px-1"
      >
        X
      </button>
    </div>
  );
}
