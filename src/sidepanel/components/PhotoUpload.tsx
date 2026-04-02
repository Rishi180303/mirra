import { useRef } from "react";
import { setPersonImage } from "../../shared/storage";

interface Props {
  personImage: string | null;
  onImageChange: (base64: string | null) => void;
}

export default function PhotoUpload({ personImage, onImageChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      await setPersonImage(base64);
      onImageChange(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = async () => {
    await chrome.storage.local.remove("personImage");
    onImageChange(null);
  };

  return (
    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
      <label className="text-xs text-gray-400 block mb-2">Your Photo</label>
      {personImage ? (
        <div className="relative">
          <img
            src={personImage}
            alt="Your photo"
            className="w-full max-h-48 object-contain rounded"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex-1 text-xs text-gray-400 hover:text-white bg-white/10 rounded px-2 py-1 transition-colors"
            >
              Change
            </button>
            <button
              onClick={handleRemove}
              className="text-xs text-red-400 hover:text-red-300 bg-white/10 rounded px-2 py-1 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-indigo-500/50 transition-colors cursor-pointer"
        >
          <div className="text-2xl mb-1">+</div>
          <div className="text-xs text-gray-400">Upload a full-body photo</div>
        </button>
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
