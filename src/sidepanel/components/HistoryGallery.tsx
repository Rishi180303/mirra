import { useState, useEffect } from "react";
import { getHistory } from "../../shared/storage";

interface HistoryItem {
  id: string;
  garmentUrl: string;
  resultImage: string;
  timestamp: number;
}

export default function HistoryGallery() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    getHistory().then(setHistory);
  }, []);

  useEffect(() => {
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.tryOnHistory) {
        setHistory((changes.tryOnHistory.newValue as HistoryItem[]) ?? []);
      }
    };
    chrome.storage.local.onChanged.addListener(listener);
    return () => chrome.storage.local.onChanged.removeListener(listener);
  }, []);

  if (history.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="w-full h-px bg-neutral-200" />
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="flex items-center justify-between w-full"
      >
        <span className="text-[10px] tracking-[0.15em] uppercase font-light text-neutral-400">
          History ({history.length})
        </span>
        <span className="text-[10px] text-neutral-300">
          {showHistory ? "\u2212" : "\u002B"}
        </span>
      </button>

      {showHistory && (
        <div className="grid grid-cols-3 gap-1">
          {history.map((item) => (
            <img
              key={item.id}
              src={item.resultImage}
              alt="Try-on result"
              className="w-full aspect-[3/4] object-cover cursor-pointer hover:opacity-70 transition-opacity duration-300"
              onClick={() => setExpanded(expanded === item.id ? null : item.id)}
            />
          ))}
        </div>
      )}

      {expanded && (
        <div
          className="fixed inset-0 bg-white/95 z-50 flex items-center justify-center p-6 cursor-pointer"
          onClick={() => setExpanded(null)}
        >
          <img
            src={history.find((h) => h.id === expanded)?.resultImage}
            alt="Try-on result"
            className="max-w-full max-h-full"
          />
        </div>
      )}
    </div>
  );
}
