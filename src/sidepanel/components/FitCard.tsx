import { useObjectUrl } from "../../hooks/useObjectUrl";
import type { SavedFit } from "../../storage/fitsDb";

interface Props {
  fit: SavedFit;
  onOpen: (id: string) => void;
}

export default function FitCard({ fit, onOpen }: Props) {
  const thumbnailUrl = useObjectUrl(fit.thumbnailBlob);

  return (
    <button
      onClick={() => onOpen(fit.id)}
      aria-label="Open fit"
      className="relative block w-full aspect-[3/4] bg-neutral-50 rounded-sm overflow-hidden group"
    >
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt=""
          className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-90"
        />
      )}

      {fit.favorited && (
        <span className="absolute top-1.5 right-1.5 text-[11px] text-black drop-shadow-sm">
          ★
        </span>
      )}
    </button>
  );
}
