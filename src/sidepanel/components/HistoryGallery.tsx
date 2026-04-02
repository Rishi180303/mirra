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

  // Refresh history when storage changes
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
    <div className="bg-white/5 rounded-lg border border-white/10">
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="w-full p-3 flex items-center justify-between text-xs text-gray-400 hover:text-white transition-colors"
      >
        <span>History ({history.length})</span>
        <span>{showHistory ? "\u25B2" : "\u25BC"}</span>
      </button>

      {showHistory && (
        <div className="px-3 pb-3 grid grid-cols-3 gap-2">
          {history.map((item) => (
            <div key={item.id} className="relative">
              <img
                src={item.resultImage}
                alt="Try-on result"
                className="w-full aspect-[3/4] object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setExpanded(expanded === item.id ? null : item.id)}
              />
              <div className="text-[9px] text-gray-500 mt-0.5 truncate">
                {new Date(item.timestamp).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expanded view */}
      {expanded && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setExpanded(null)}
        >
          <img
            src={history.find((h) => h.id === expanded)?.resultImage}
            alt="Try-on result"
            className="max-w-full max-h-full rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
