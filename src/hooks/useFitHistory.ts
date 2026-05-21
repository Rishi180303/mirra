import { useCallback, useEffect, useRef, useState } from "react";
import {
  saveFit,
  getRecentFits,
  getFavorites,
  toggleFavorite as toggleFavoriteDb,
  deleteFit,
  type SavedFit,
} from "../storage/fitsDb";

const RECENT_LIMIT = 10;
// effectively unbounded — Chrome IDB quota caps practical fit count well below this
const UNBOUNDED_LIMIT = 10_000;

export interface UseFitHistory {
  fits: SavedFit[];
  favorites: SavedFit[];
  loading: boolean;
  error: Error | null;
  showAll: boolean;
  setShowAll: (value: boolean) => void;
  save: (
    imageBlob: Blob,
    metadata: { garmentCount: number; sourceUrl?: string }
  ) => Promise<SavedFit>;
  toggleFavorite: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function useFitHistory(): UseFitHistory {
  const [fits, setFits] = useState<SavedFit[]>([]);
  const [favorites, setFavorites] = useState<SavedFit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showAll, setShowAllState] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchAll = useCallback(
    async (limit: number, withLoading: boolean): Promise<void> => {
      if (withLoading) setLoading(true);
      try {
        const [fitsResult, favoritesResult] = await Promise.all([
          getRecentFits(limit),
          getFavorites(),
        ]);
        if (!mountedRef.current) return;
        setFits(fitsResult);
        setFavorites(favoritesResult);
        setError(null);
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (mountedRef.current && withLoading) setLoading(false);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    fetchAll(RECENT_LIMIT, true);
  }, [fetchAll]);

  const setShowAll = useCallback(
    (value: boolean) => {
      setShowAllState(value);
      fetchAll(value ? UNBOUNDED_LIMIT : RECENT_LIMIT, true);
    },
    [fetchAll]
  );

  const save = useCallback(
    async (
      imageBlob: Blob,
      metadata: { garmentCount: number; sourceUrl?: string }
    ): Promise<SavedFit> => {
      try {
        const fit = await saveFit(imageBlob, metadata);
        await fetchAll(showAll ? UNBOUNDED_LIMIT : RECENT_LIMIT, false);
        return fit;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        if (mountedRef.current) setError(e);
        throw e;
      }
    },
    [fetchAll, showAll]
  );

  const toggleFavorite = useCallback(
    async (id: string): Promise<void> => {
      try {
        await toggleFavoriteDb(id);
        await fetchAll(showAll ? UNBOUNDED_LIMIT : RECENT_LIMIT, false);
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        if (mountedRef.current) setError(e);
        throw e;
      }
    },
    [fetchAll, showAll]
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deleteFit(id);
        await fetchAll(showAll ? UNBOUNDED_LIMIT : RECENT_LIMIT, false);
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        if (mountedRef.current) setError(e);
        throw e;
      }
    },
    [fetchAll, showAll]
  );

  return {
    fits,
    favorites,
    loading,
    error,
    showAll,
    setShowAll,
    save,
    toggleFavorite,
    remove,
  };
}
