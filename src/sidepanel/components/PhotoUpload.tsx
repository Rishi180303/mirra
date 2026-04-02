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
    <div>
      {personImage ? (
        <div>
          <img
            src={personImage}
            alt="You"
            className="w-full max-h-60 object-contain"
          />
          <div className="flex gap-6 mt-4">
            <button
              onClick={() => fileRef.current?.click()}
              className="text-[9px] tracking-[0.1em] uppercase font-light text-neutral-300 hover:text-black transition-colors duration-500"
            >
              Change
            </button>
            <button
              onClick={handleRemove}
              className="text-[9px] tracking-[0.1em] uppercase font-light text-neutral-300 hover:text-black transition-colors duration-500"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          className="py-16 text-center cursor-pointer group"
        >
          <span className="text-[9px] tracking-[0.15em] uppercase font-light text-neutral-300 group-hover:text-neutral-500 transition-colors duration-500">
            Upload photo
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
