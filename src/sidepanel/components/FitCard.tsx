import { useState } from "react";
import { useObjectUrl } from "../../hooks/useObjectUrl";
import { reencodeToPng, type SavedFit } from "../../storage/fitsDb";

interface Props {
  fit: SavedFit;
  onToggleFavorite: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

type Feedback = "idle" | "copied" | "saved";

export default function FitCard({ fit, onToggleFavorite, onDelete }: Props) {
  const thumbnailUrl = useObjectUrl(fit.thumbnailBlob);
  const [feedback, setFeedback] = useState<Feedback>("idle");

  const flash = (state: Exclude<Feedback, "idle">) => {
    setFeedback(state);
    setTimeout(() => setFeedback("idle"), 1500);
  };

  const handleDownload = () => {
    const ext = fit.imageBlob.type === "image/png" ? "png" : "jpg";
    const date = new Date(fit.createdAt).toISOString().slice(0, 10);
    const filename = `mirra-fit-${date}-${fit.id.slice(0, 6)}.${ext}`;
    const url = URL.createObjectURL(fit.imageBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    flash("saved");
  };

  const handleCopy = async () => {
    try {
      const type = ClipboardItem.supports?.(fit.imageBlob.type)
        ? fit.imageBlob.type
        : "image/png";
      const blob =
        type === fit.imageBlob.type
          ? fit.imageBlob
          : await reencodeToPng(fit.imageBlob);
      await navigator.clipboard.write([new ClipboardItem({ [type]: blob })]);
      flash("copied");
    } catch (err) {
      console.error("Failed to copy fit:", err);
    }
  };

  return (
    <div className="relative group">
      <div className="aspect-[3/4] bg-neutral-50 rounded-sm overflow-hidden">
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {fit.favorited && (
        <span className="absolute top-1.5 right-1.5 text-[11px] text-black drop-shadow-sm">
          ★
        </span>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-5 py-2">
        <button
          onClick={() => onToggleFavorite(fit.id)}
          className="text-white text-[13px] hover:opacity-70 transition-opacity"
          aria-label={fit.favorited ? "Unfavorite" : "Favorite"}
        >
          {fit.favorited ? "★" : "☆"}
        </button>
        <button
          onClick={handleDownload}
          className="text-white text-[13px] hover:opacity-70 transition-opacity"
          aria-label="Download"
        >
          ↓
        </button>
        <button
          onClick={handleCopy}
          className="text-white text-[13px] hover:opacity-70 transition-opacity"
          aria-label="Copy to clipboard"
        >
          ⧉
        </button>
        <button
          onClick={() => onDelete(fit.id)}
          className="text-white text-[13px] hover:opacity-70 transition-opacity"
          aria-label="Delete"
        >
          ×
        </button>
      </div>

      {feedback !== "idle" && (
        <span className="absolute top-1.5 left-1.5 text-[7px] tracking-[0.2em] uppercase text-white bg-black/60 px-1.5 py-0.5 rounded-sm">
          {feedback}
        </span>
      )}
    </div>
  );
}
