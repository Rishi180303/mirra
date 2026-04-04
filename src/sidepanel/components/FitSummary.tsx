import type { FitResult } from "../../shared/measurements";

interface Props {
  results: FitResult[];
}

const fitLabels = {
  loose: "Loose",
  perfect: "Good fit",
  snug: "Snug",
  tight: "Too tight",
};

const fitColors = {
  loose: "text-green-600",
  perfect: "text-green-600",
  snug: "text-yellow-600",
  tight: "text-red-500",
};

export default function FitSummary({ results }: Props) {
  if (results.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {results.map((r) => (
        <div key={r.area} className="flex items-center justify-between">
          <span className="text-[10px] tracking-[0.1em] uppercase font-light text-neutral-500">
            {r.area}
          </span>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-light ${fitColors[r.fit]}`}>
              {fitLabels[r.fit]}
            </span>
            <span className="text-[9px] font-light text-neutral-300">
              {r.diff > 0 ? `+${r.diff.toFixed(0)}cm` : `${r.diff.toFixed(0)}cm`}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
