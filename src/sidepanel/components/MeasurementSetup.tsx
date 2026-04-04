import { useState } from "react";
import type { BodyMeasurements } from "../../shared/measurements";
import { setBodyMeasurements } from "../../shared/measurements";

interface Props {
  onComplete: (m: BodyMeasurements) => void;
  existing?: BodyMeasurements | null;
}

const fields: { key: keyof BodyMeasurements; label: string; placeholder: string }[] = [
  { key: "height", label: "Height", placeholder: "175" },
  { key: "chest", label: "Chest", placeholder: "96" },
  { key: "waist", label: "Waist", placeholder: "82" },
  { key: "hips", label: "Hips", placeholder: "98" },
  { key: "shoulderWidth", label: "Shoulders", placeholder: "46" },
  { key: "inseam", label: "Inseam", placeholder: "80" },
];

const defaults: BodyMeasurements = {
  height: 175,
  chest: 96,
  waist: 82,
  hips: 98,
  shoulderWidth: 46,
  inseam: 80,
};

export default function MeasurementSetup({ onComplete, existing }: Props) {
  const [values, setValues] = useState<BodyMeasurements>(existing || defaults);

  const handleChange = (key: keyof BodyMeasurements, val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setValues((prev) => ({ ...prev, [key]: num }));
    }
  };

  const handleSave = async () => {
    await setBodyMeasurements(values);
    onComplete(values);
  };

  return (
    <div className="flex flex-col gap-8">
      <span className="text-[11px] tracking-[0.35em] uppercase font-normal">
        Your measurements
      </span>
      <span className="text-[9px] font-light text-neutral-400">
        All values in centimeters
      </span>

      <div className="flex flex-col gap-4">
        {fields.map(({ key, label, placeholder }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-[10px] tracking-[0.1em] uppercase font-light text-neutral-500">
              {label}
            </span>
            <input
              type="number"
              value={values[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={placeholder}
              className="w-20 text-right text-[11px] font-light border-b border-neutral-200 focus:border-black outline-none py-1 bg-transparent transition-colors duration-300"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        className="w-full py-3 text-[10px] tracking-[0.2em] uppercase text-black hover:tracking-[0.3em] transition-all duration-500"
      >
        Save
      </button>
    </div>
  );
}
