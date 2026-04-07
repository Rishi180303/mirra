interface Props {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export default function Carousel({ items, selectedIndex, onSelect }: Props) {
  const hasPrev = selectedIndex > 0;
  const hasNext = selectedIndex < items.length - 1;

  return (
    <div className="flex items-center gap-3">
      {/* Prev arrow */}
      <button
        onClick={() => hasPrev && onSelect(selectedIndex - 1)}
        className={`text-[14px] font-light select-none transition-colors duration-300 ${
          hasPrev ? "text-black hover:text-neutral-600" : "text-neutral-200"
        }`}
      >
        &larr;
      </button>

      {/* Items strip */}
      <div className="flex-1 flex items-center justify-center gap-2 overflow-hidden">
        {items.map((url, i) => {
          const isSelected = i === selectedIndex;
          const isAdjacent = Math.abs(i - selectedIndex) === 1;
          if (!isSelected && !isAdjacent) return null;

          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className={`flex-shrink-0 transition-all duration-300 ${
                isSelected
                  ? "w-16 h-16 opacity-100"
                  : "w-11 h-11 opacity-30 blur-[1px]"
              }`}
            >
              <img
                src={url}
                alt=""
                className="w-full h-full object-contain"
              />
            </button>
          );
        })}
      </div>

      {/* Next arrow */}
      <button
        onClick={() => hasNext && onSelect(selectedIndex + 1)}
        className={`text-[14px] font-light select-none transition-colors duration-300 ${
          hasNext ? "text-black hover:text-neutral-600" : "text-neutral-200"
        }`}
      >
        &rarr;
      </button>
    </div>
  );
}
