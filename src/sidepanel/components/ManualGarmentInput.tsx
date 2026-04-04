import { useState } from "react";
import type { GarmentInfo } from "../../shared/types";

interface Props {
  onGarmentSelected: (garment: GarmentInfo) => void;
}

export default function ManualGarmentInput({ onGarmentSelected }: Props) {
  const [url, setUrl] = useState("");
  const [show, setShow] = useState(false);

  const handleSubmit = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    onGarmentSelected({ imageUrl: trimmed, title: "Manual input" });
    setUrl("");
    setShow(false);
  };

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="text-[9px] tracking-[0.1em] uppercase font-light text-neutral-400 hover:text-neutral-500 transition-colors duration-500 self-start"
      >
        Paste URL
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder="Paste garment image URL"
        className="flex-1 border-b border-neutral-200 focus:border-neutral-400 outline-none text-[10px] font-light py-1 transition-colors duration-500 bg-transparent placeholder-neutral-300"
        autoFocus
      />
      <button
        onClick={handleSubmit}
        className="text-[9px] tracking-[0.1em] uppercase font-light text-neutral-400 hover:text-black transition-colors duration-500"
      >
        Go
      </button>
      <button
        onClick={() => { setShow(false); setUrl(""); }}
        className="text-[9px] text-neutral-400 hover:text-black transition-colors duration-500"
      >
        X
      </button>
    </div>
  );
}
