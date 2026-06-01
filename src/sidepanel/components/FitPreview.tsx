import { useState } from "react";
import { useObjectUrl } from "../../hooks/useObjectUrl";
import type { SavedFit } from "../../storage/fitsDb";

interface Props {
  fit: SavedFit;
  onClose: () => void;
  onToggleFavorite: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const labelClass =
  "text-[9px] tracking-[0.1em] uppercase font-light text-neutral-400 hover:text-black transition-colors duration-500";

export default function FitPreview({
  fit,
  onClose,
  onToggleFavorite,
  onDelete,
}: Props) {
  const imageUrl = useObjectUrl(fit.imageBlob);
  const [saved, setSaved] = useState(false);

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
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleDelete = async () => {
    await onDelete(fit.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col px-6 py-8 gap-6">
      {/* Header with back */}
      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          aria-label="Close preview"
          className="text-[14px] font-light text-neutral-400 hover:text-black transition-colors duration-300"
        >
          ←
        </button>
        <span className="text-[11px] font-normal tracking-[0.35em] uppercase">
          Mirra
        </span>
      </div>

      {/* Full-resolution image */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Fit preview"
            className="max-w-full max-h-full object-contain"
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => onToggleFavorite(fit.id)}
          aria-label={fit.favorited ? "Unfavorite" : "Favorite"}
          className={`text-[13px] leading-none transition-colors duration-500 ${
            fit.favorited ? "text-black" : "text-neutral-400 hover:text-black"
          }`}
        >
          {fit.favorited ? "♥" : "♡"}
        </button>
        <button onClick={handleDownload} className={labelClass}>
          {saved ? "Saved" : "Download"}
        </button>
        <button onClick={handleDelete} className={labelClass}>
          Delete
        </button>
      </div>
    </div>
  );
}
