interface Props {
  loading: boolean;
  error: string | null;
}

export default function StatusBar({ loading, error }: Props) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-indigo-300">
        <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        Generating your try-on... this takes ~5-8 seconds
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-xs text-red-400 bg-red-400/10 rounded p-2">
        {error}
      </div>
    );
  }

  return null;
}
