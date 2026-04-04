import { useState } from "react";
import type { GarmentSize } from "../../shared/measurements";

interface Props {
  onSubmit: (size: GarmentSize) => void;
}

export default function GarmentSizeInput({ onSubmit }: Props) {
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");

  const handleSubmit = () => {
    const size: GarmentSize = {};
    if (chest) size.chest = parseFloat(chest);
    if (waist) size.waist = parseFloat(waist);
    if (hips) size.hips = parseFloat(hips);
    if (Object.keys(size).length > 0) {
      onSubmit(size);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <span className="text-[10px] tracking-[0.1em] uppercase font-light text-neutral-500">
        Garment measurements (cm)
      </span>

      <div className="flex gap-3">
        <div className="flex-1">
          <input
            type="number"
            value={chest}
            onChange={(e) => setChest(e.target.value)}
            placeholder="Chest"
            className="w-full text-[10px] font-light border-b border-neutral-200 focus:border-black outline-none py-1 bg-transparent transition-colors duration-300 placeholder-neutral-300"
          />
        </div>
        <div className="flex-1">
          <input
            type="number"
            value={waist}
            onChange={(e) => setWaist(e.target.value)}
            placeholder="Waist"
            className="w-full text-[10px] font-light border-b border-neutral-200 focus:border-black outline-none py-1 bg-transparent transition-colors duration-300 placeholder-neutral-300"
          />
        </div>
        <div className="flex-1">
          <input
            type="number"
            value={hips}
            onChange={(e) => setHips(e.target.value)}
            placeholder="Hips"
            className="w-full text-[10px] font-light border-b border-neutral-200 focus:border-black outline-none py-1 bg-transparent transition-colors duration-300 placeholder-neutral-300"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="text-[9px] tracking-[0.15em] uppercase font-light text-neutral-400 hover:text-black transition-colors duration-500 self-start"
      >
        Check fit
      </button>
    </div>
  );
}
