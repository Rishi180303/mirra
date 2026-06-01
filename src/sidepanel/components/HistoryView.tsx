import { useState } from "react";
import { useFitHistory } from "../../hooks/useFitHistory";
import FitCard from "./FitCard";
import FitPreview from "./FitPreview";

interface Props {
  onBack: () => void;
}

type Tab = "recent" | "favorites";

export default function HistoryView({ onBack }: Props) {
  const {
    fits,
    favorites,
    loading,
    showAll,
    setShowAll,
    toggleFavorite,
    remove,
  } = useFitHistory();
  const [tab, setTab] = useState<Tab>("recent");
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = tab === "recent" ? fits : favorites;
  // Derive from the live list so the preview reflects favorite/delete updates;
  // if the open fit disappears (deleted / unfavorited off this tab), it closes.
  const openFit = openId != null ? visible.find((f) => f.id === openId) ?? null : null;
  const showToggle =
    tab === "recent" && !loading && (showAll || fits.length === 10);

  return (
    <div className="px-6 py-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-[14px] font-light text-neutral-400 hover:text-black transition-colors duration-300"
          >
            ←
          </button>
          <span className="text-[11px] font-normal tracking-[0.35em] uppercase">
            Mirra
          </span>
        </div>
        <span className="text-[9px] tracking-[0.15em] uppercase font-light text-neutral-400">
          History
        </span>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setTab("recent")}
          className={`text-[9px] tracking-[0.15em] uppercase font-light transition-colors duration-300 ${
            tab === "recent"
              ? "text-black"
              : "text-neutral-400 hover:text-black"
          }`}
        >
          Recent
        </button>
        <span className="text-[9px] text-neutral-300">·</span>
        <button
          onClick={() => setTab("favorites")}
          className={`text-[9px] tracking-[0.15em] uppercase font-light transition-colors duration-300 ${
            tab === "favorites"
              ? "text-black"
              : "text-neutral-400 hover:text-black"
          }`}
        >
          Favorites
        </button>
      </div>

      {loading && (
        <span className="text-[9px] tracking-[0.15em] uppercase font-light text-neutral-400 text-center animate-pulse">
          Loading
        </span>
      )}

      {!loading && visible.length === 0 && (
        <span className="text-[9px] tracking-[0.15em] uppercase font-light text-neutral-300 text-center">
          {tab === "recent"
            ? "No fits yet · Save a look to see it here"
            : "No favorites yet"}
        </span>
      )}

      {!loading && visible.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {visible.map((fit) => (
            <FitCard key={fit.id} fit={fit} onOpen={setOpenId} />
          ))}
        </div>
      )}

      {showToggle && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-[9px] tracking-[0.15em] uppercase font-light text-neutral-400 hover:text-black transition-colors duration-300 text-center py-2"
        >
          {showAll ? "Show less" : "See all"}
        </button>
      )}

      {openFit && (
        <FitPreview
          fit={openFit}
          onClose={() => setOpenId(null)}
          onToggleFavorite={toggleFavorite}
          onDelete={remove}
        />
      )}
    </div>
  );
}
