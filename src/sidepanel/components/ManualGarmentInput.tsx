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
        className="text-[10px] tracking-[0.1em] uppercase font-light text-neutral-300 hover:text-black transition-colors duration-300 self-start"
      >
        Paste garment URL
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
        placeholder="Image URL"
        className="flex-1 border-b border-neutral-200 focus:border-black outline-none text-[11px] font-light py-1.5 transition-colors duration-300 bg-transparent placeholder-neutral-300"
        autoFocus
      />
      <button
        onClick={handleSubmit}
        disabled={!url.trim()}
        className="text-[10px] tracking-[0.1em] uppercase font-light text-neutral-400 hover:text-black disabled:text-neutral-200 transition-colors duration-300"
      >
        Use
      </button>
      <button
        onClick={() => setShow(false)}
        className="text-[10px] text-neutral-300 hover:text-black transition-colors duration-300"
      >
        X
      </button>
    </div>
  );
}
