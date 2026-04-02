interface Props {
  resultImage: string | null;
}

export default function TryOnResult({ resultImage }: Props) {
  if (!resultImage) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="w-full h-px bg-neutral-200" />
      <span className="text-[10px] tracking-[0.15em] uppercase font-light text-neutral-400">
        Result
      </span>
      <img
        src={resultImage}
        alt="Try-on result"
        className="w-full"
      />
      <a
        href={resultImage}
        download="mirra-result.png"
        className="text-[10px] tracking-[0.1em] uppercase font-light text-neutral-400 hover:text-black transition-colors duration-300 underline underline-offset-4 self-start"
      >
        Download
      </a>
    </div>
  );
}
