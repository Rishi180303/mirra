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
    <div className="flex flex-col gap-3">
      <span className="text-[10px] tracking-[0.15em] uppercase font-light text-neutral-400">
        Your Photo
      </span>
      {personImage ? (
        <div>
          <img
            src={personImage}
            alt="Your photo"
            className="w-full max-h-56 object-contain"
          />
          <div className="flex gap-4 mt-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="text-[10px] tracking-[0.1em] uppercase font-light text-neutral-400 hover:text-black transition-colors duration-300 underline underline-offset-4"
            >
              Change
            </button>
            <button
              onClick={handleRemove}
              className="text-[10px] tracking-[0.1em] uppercase font-light text-neutral-400 hover:text-black transition-colors duration-300 underline underline-offset-4"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full border border-neutral-200 py-10 text-center hover:border-black transition-colors duration-300 cursor-pointer"
        >
          <div className="text-[10px] tracking-[0.15em] uppercase font-light text-neutral-400">
            Upload full-body photo
          </div>
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
