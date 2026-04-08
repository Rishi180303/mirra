interface Props {
  items: string[];
  selectedIndices: Set<number>;
  onToggle: (index: number) => void;
}

export default function Carousel({ items, selectedIndices, onToggle }: Props) {
  return (
    <div>
      <span className="text-[7px] tracking-[0.15em] uppercase font-light text-neutral-300 block mb-3">
        Tap to select pieces to wear together
      </span>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {items.map((url, i) => {
          const isSelected = selectedIndices.has(i);

          return (
            <button
              key={i}
              onClick={() => onToggle(i)}
              className={`flex-shrink-0 relative w-16 h-16 transition-all duration-300 ${
                isSelected ? "ring-1 ring-black ring-offset-2" : "opacity-40"
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
      {selectedIndices.size > 0 && (
        <p className="mt-2 text-[7px] tracking-[0.1em] font-light text-neutral-400 text-center">
          {selectedIndices.size} {selectedIndices.size === 1 ? "piece" : "pieces"} selected
        </p>
      )}
    </div>
  );
}
