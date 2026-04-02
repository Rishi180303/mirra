interface Props {
  loading: boolean;
  error: string | null;
}

export default function StatusBar({ loading, error }: Props) {
  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 border border-black border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] tracking-[0.1em] uppercase font-light text-neutral-400">
          Generating...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-[10px] tracking-[0.05em] font-light text-red-500 border-l-2 border-red-500 pl-3 py-1">
        {error}
      </div>
    );
  }

  return null;
}
