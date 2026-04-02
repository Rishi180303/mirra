interface Props {
  resultImage: string | null;
}

export default function TryOnResult({ resultImage }: Props) {
  if (!resultImage) return null;

  return (
    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
      <label className="text-xs text-gray-400 block mb-2">Result</label>
      <img
        src={resultImage}
        alt="Try-on result"
        className="w-full rounded"
      />
      <a
        href={resultImage}
        download="tryon-result.png"
        className="block text-center text-xs text-indigo-400 hover:text-indigo-300 mt-2 transition-colors"
      >
        Download
      </a>
    </div>
  );
}
