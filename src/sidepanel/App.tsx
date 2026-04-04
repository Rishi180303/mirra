import { useState, useEffect } from "react";
import BodyViewer from "./components/BodyViewer";
import MeasurementSetup from "./components/MeasurementSetup";
import GarmentSizeInput from "./components/GarmentSizeInput";
import FitSummary from "./components/FitSummary";
import { getBodyMeasurements, analyzeFit } from "../shared/measurements";
import type { BodyMeasurements, GarmentSize, FitResult } from "../shared/measurements";

type View = "loading" | "setup" | "main";

export default function App() {
  const [view, setView] = useState<View>("loading");
  const [measurements, setMeasurements] = useState<BodyMeasurements | null>(null);
  const [fitResults, setFitResults] = useState<FitResult[]>([]);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    getBodyMeasurements().then((m) => {
      if (m) {
        setMeasurements(m);
        setView("main");
      } else {
        setView("setup");
      }
    });
  }, []);

  const handleSetupComplete = (m: BodyMeasurements) => {
    setMeasurements(m);
    setEditing(false);
    setView("main");
  };

  const handleGarmentSize = (garment: GarmentSize) => {
    if (!measurements) return;
    const results = analyzeFit(measurements, garment);
    setFitResults(results);
  };

  if (view === "loading") return null;

  if (view === "setup" || editing) {
    return (
      <div className="px-7 py-10">
        <MeasurementSetup
          onComplete={handleSetupComplete}
          existing={measurements}
        />
      </div>
    );
  }

  return (
    <div className="px-7 py-10 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-normal tracking-[0.35em] uppercase">
          Mirra
        </span>
        <button
          onClick={() => setEditing(true)}
          className="text-[9px] tracking-[0.12em] uppercase font-light text-neutral-400 hover:text-black transition-colors duration-500"
        >
          Edit body
        </button>
      </div>

      {/* 3D Body */}
      {measurements && (
        <BodyViewer measurements={measurements} fitResults={fitResults.length > 0 ? fitResults : undefined} />
      )}

      {/* Fit Summary */}
      <FitSummary results={fitResults} />

      {/* Divider */}
      <div className="w-full h-px bg-neutral-100" />

      {/* Garment Size Input */}
      <GarmentSizeInput onSubmit={handleGarmentSize} />
    </div>
  );
}
