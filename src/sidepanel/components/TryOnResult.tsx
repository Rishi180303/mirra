interface Props {
  resultImage: string | null;
}

export default function TryOnResult({ resultImage }: Props) {
  if (!resultImage) return null;

  return (
    <div>
      <img
        src={resultImage}
        alt="Result"
        className="w-full"
      />
      <a
        href={resultImage}
        download="mirra-result.png"
        className="inline-block mt-3 text-[9px] tracking-[0.1em] uppercase font-light text-neutral-300 hover:text-black transition-colors duration-500"
      >
        Save
      </a>
    </div>
  );
}
