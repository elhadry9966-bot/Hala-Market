import { Heart } from 'lucide-react';
import { useFavorites } from '@/contexts/FavoritesContext';

interface FavoriteButtonProps {
  slug: string;
  variant?: 'icon' | 'full';
}

export default function FavoriteButton({ slug, variant = 'icon' }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(slug);
  const label = active ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة';

  const iconClass = `h-4 w-4 transition ${active ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`;

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={() => toggleFavorite(slug)}
        aria-pressed={active}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-full border px-6 py-3.5 text-sm font-bold transition hover:-translate-y-0.5 ${
          active
            ? 'border-rose-200 bg-rose-50 text-rose-600'
            : 'border-stone-300 bg-white text-slate-800 hover:border-slate-900'
        }`}
      >
        <Heart className={`h-4 w-4 ${active ? 'fill-rose-500 text-rose-500' : ''}`} aria-hidden />
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggleFavorite(slug)}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-stone-200 transition hover:scale-110 hover:ring-rose-200"
    >
      <Heart className={iconClass} aria-hidden />
    </button>
  );
}
