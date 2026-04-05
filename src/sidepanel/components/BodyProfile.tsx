import { useState, useEffect, useRef } from "react";
import type { BodyPhoto } from "../../shared/types";
import {
  getAllPhotos,
  saveBodyPhoto,
  deleteBodyPhoto,
  migrateFromChromeStorage,
} from "../../services/body-manager";

interface Props {
  onPhotosChange: () => void;
}

export default function BodyProfile({ onPhotosChange }: Props) {
  const [photo, setPhoto] = useState<BodyPhoto | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    migrateFromChromeStorage().then(() => {
      getAllPhotos().then((photos) => setPhoto(photos.front));
    });
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;

      try {
        await saveBodyPhoto(base64, "front");
        const updated = await getAllPhotos();
        setPhoto(updated.front);
        onPhotosChange();
      } catch {
        // Save failed silently
      }

      setLoading(false);
    };
    reader.readAsDataURL(file);

    e.target.value = "";
  };

  const handleDelete = async () => {
    await deleteBodyPhoto("front");
    setPhoto(null);
    onPhotosChange();
  };

  return (
    <div>
      {photo ? (
        <div>
          <img
            src={photo.image}
            alt="You"
            className="w-full max-h-96 object-contain"
          />
          <div className="flex gap-6 mt-4">
            <button
              onClick={() => fileRef.current?.click()}
              className="text-[9px] tracking-[0.1em] uppercase font-light text-neutral-400 hover:text-black transition-colors duration-500"
            >
              Change
            </button>
            <button
              onClick={handleDelete}
              className="text-[9px] tracking-[0.1em] uppercase font-light text-neutral-400 hover:text-black transition-colors duration-500"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          className={`py-16 text-center cursor-pointer group ${loading ? "animate-pulse" : ""}`}
        >
          <span className="text-[9px] tracking-[0.15em] uppercase font-light text-neutral-400 group-hover:text-neutral-500 transition-colors duration-500">
            {loading ? "Processing..." : "Upload photo"}
          </span>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
