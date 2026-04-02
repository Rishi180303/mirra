interface Props {
  loading: boolean;
  error: string | null;
}

export default function StatusBar({ loading, error }: Props) {
  if (loading) {
    return (
      <span className="text-[9px] tracking-[0.1em] uppercase font-light text-neutral-300 animate-pulse">
        Generating
      </span>
    );
  }

  if (error) {
    return (
      <span className="text-[9px] tracking-[0.05em] font-light text-neutral-400">
        {error}
      </span>
    );
  }

  return null;
}
