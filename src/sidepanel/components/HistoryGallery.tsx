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
  const [open, setOpen] = useState(false);

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
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="text-[9px] tracking-[0.1em] uppercase font-light text-neutral-400 hover:text-neutral-500 transition-colors duration-500"
      >
        {open ? "Close" : `History (${history.length})`}
      </button>

      {open && (
        <div className="grid grid-cols-3 gap-px mt-4">
          {history.map((item) => (
            <img
              key={item.id}
              src={item.resultImage}
              alt=""
              className="w-full aspect-[3/4] object-cover cursor-pointer hover:opacity-60 transition-opacity duration-300"
              onClick={() => setExpanded(expanded === item.id ? null : item.id)}
            />
          ))}
        </div>
      )}

      {expanded && (
        <div
          className="fixed inset-0 bg-white z-50 flex items-center justify-center p-8 cursor-pointer"
          onClick={() => setExpanded(null)}
        >
          <img
            src={history.find((h) => h.id === expanded)?.resultImage}
            alt=""
            className="max-w-full max-h-full"
          />
        </div>
      )}
    </div>
  );
}
