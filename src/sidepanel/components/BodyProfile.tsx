import { useState, useEffect, useRef } from "react";
import type { PoseType, BodyPhoto } from "../../shared/types";
import {
  getAllPhotos,
  saveBodyPhoto,
  deleteBodyPhoto,
  migrateFromChromeStorage,
} from "../../services/body-manager";

interface Props {
  onPhotosChange: () => void;
}

const POSES: { key: PoseType; label: string }[] = [
  { key: "front", label: "Front" },
  { key: "side", label: "Side" },
  { key: "back", label: "Back" },
];

export default function BodyProfile({ onPhotosChange }: Props) {
  const [photos, setPhotos] = useState<Record<PoseType, BodyPhoto | null>>({
    front: null,
    side: null,
    back: null,
  });
  const [loading, setLoading] = useState<PoseType | null>(null);
  const [mismatch, setMismatch] = useState<{
    targetPose: PoseType;
    detectedPose: PoseType;
    imageBase64: string;
  } | null>(null);
  const fileRefs = useRef<Record<PoseType, HTMLInputElement | null>>({
    front: null,
    side: null,
    back: null,
  });

  useEffect(() => {
    migrateFromChromeStorage().then(() => {
      getAllPhotos().then(setPhotos);
    });
  }, []);

  const handleFile = async (pose: PoseType, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(pose);
    setMismatch(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;

      try {
        const result = await saveBodyPhoto(base64, pose);

        if (result.detectedPose && result.detectedPose !== pose) {
          setMismatch({
            targetPose: pose,
            detectedPose: result.detectedPose,
            imageBase64: base64,
          });
        }

        const updated = await getAllPhotos();
        setPhotos(updated);
        onPhotosChange();
      } catch {
        // Save failed silently
      }

      setLoading(null);
    };
    reader.readAsDataURL(file);

    e.target.value = "";
  };

  const handleMismatchAccept = async () => {
    if (!mismatch) return;
    await deleteBodyPhoto(mismatch.targetPose);
    await saveBodyPhoto(mismatch.imageBase64, mismatch.detectedPose);
    const updated = await getAllPhotos();
    setPhotos(updated);
    setMismatch(null);
    onPhotosChange();
  };

  const handleDelete = async (pose: PoseType) => {
    await deleteBodyPhoto(pose);
    const updated = await getAllPhotos();
    setPhotos(updated);
    onPhotosChange();
  };

  return (
    <div>
      <div className="flex gap-4">
        {POSES.map(({ key, label }) => (
          <div key={key} className="flex-1 flex flex-col items-center gap-2">
            <span className="text-[8px] tracking-[0.15em] uppercase font-light text-neutral-400">
              {label}
            </span>

            {photos[key] ? (
              <div className="relative group w-full">
                <img
                  src={photos[key]!.image}
                  alt={label}
                  className="w-full aspect-[3/4] object-cover"
                />
                <button
                  onClick={() => handleDelete(key)}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-[8px] text-neutral-400 hover:text-black transition-all duration-300"
                >
                  X
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileRefs.current[key]?.click()}
                className={`w-full aspect-[3/4] flex items-center justify-center cursor-pointer border border-dashed border-neutral-200 hover:border-neutral-400 transition-colors duration-500 ${
                  loading === key ? "animate-pulse" : ""
                }`}
              >
                <span className="text-[9px] text-neutral-300">
                  {loading === key ? "..." : "+"}
                </span>
              </div>
            )}

            <input
              ref={(el) => { fileRefs.current[key] = el; }}
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(key, e)}
              className="hidden"
            />
          </div>
        ))}
      </div>

      {mismatch && (
        <div className="mt-3 text-[9px] font-light text-neutral-500">
          <span>
            This looks like a {mismatch.detectedPose} view —{" "}
          </span>
          <button
            onClick={handleMismatchAccept}
            className="underline hover:text-black transition-colors duration-300"
          >
            save as {mismatch.detectedPose}
          </button>
          <span> instead?</span>
        </div>
      )}
    </div>
  );
}
