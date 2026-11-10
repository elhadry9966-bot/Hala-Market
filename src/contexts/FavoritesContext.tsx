import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

const STORAGE_KEY = 'smart-market-favorites';

interface FavoritesContextValue {
  favorites: string[];
  isFavorite: (slug: string) => boolean;
  toggleFavorite: (slug: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function readFavorites(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>(readFavorites);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = useCallback((slug: string) => {
    setFavorites((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug],
    );
  }, []);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      isFavorite: (slug) => favorites.includes(slug),
      toggleFavorite,
    }),
    [favorites, toggleFavorite],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used inside FavoritesProvider');
  return context;
}
