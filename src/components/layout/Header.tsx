import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Heart, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { buildHash } from '@/lib/router';

interface HeaderProps {
  currentPath: string;
  initialQuery: string;
}

const NAV_LINKS = [
  { label: 'الرئيسية', path: '/' },
  { label: 'جميع المنتجات', path: '/products' },
  { label: 'التصنيفات', path: '/categories' },
  { label: 'من نحن', path: '/about' },
  { label: 'اتصل بنا', path: '/contact' },
];

export default function Header({ currentPath, initialQuery }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const { favorites } = useFavorites();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [currentPath]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = query.trim();
    window.location.hash = buildHash('/products', { q: term || undefined });
  };

  const linkClass = (path: string) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${
      currentPath === path ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-stone-100 hover:text-teal-700'
    }`;

  const searchField = (
    <label className="relative block">
      <span className="sr-only">ابحث عن منتج</span>
      <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="ابحث عن منتج أو علامة تجارية..."
        className="h-11 w-full rounded-full border border-stone-200 bg-stone-50 pr-11 pl-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-600/10"
      />
    </label>
  );

  return (
    <header
      className={`sticky top-0 z-40 border-b bg-white transition-shadow duration-300 ${
        scrolled ? 'border-stone-200 shadow-md shadow-slate-900/5' : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6 lg:px-8">
        <a href="#/" className="flex shrink-0 items-center gap-2.5" aria-label="Smart Market - الرئيسية">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white">
            <ShoppingBag className="h-5 w-5" aria-hidden />
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-lg font-bold text-slate-900">Smart Market</span>
            <span className="text-xs text-slate-500">سمارت ماركت</span>
          </span>
        </a>

        <form onSubmit={submitSearch} role="search" className="hidden flex-1 md:block">
          {searchField}
        </form>

        <nav className="mr-auto hidden items-center gap-1 xl:flex" aria-label="التنقل الرئيسي">
          {NAV_LINKS.map((link) => (
            <a key={link.path} href={`#${link.path}`} className={linkClass(link.path)} aria-current={currentPath === link.path ? 'page' : undefined}>
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="#/favorites"
          className={`relative mr-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-stone-100 xl:mr-0 ${
            currentPath === '/favorites' ? 'bg-rose-50 text-rose-600' : 'text-slate-700'
          }`}
          aria-label={`المفضلة (${favorites.length})`}
        >
          <Heart className="h-5 w-5" aria-hidden />
          {favorites.length > 0 && (
            <span className="absolute -left-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white">
              {favorites.length}
            </span>
          )}
        </a>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-700 transition hover:bg-stone-100 xl:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
        >
          {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
        </button>
      </div>

      <form onSubmit={submitSearch} role="search" className="px-4 pb-3 md:hidden">
        {searchField}
      </form>

      {menuOpen && (
        <nav id="mobile-menu" className="animate-fadeIn border-t border-stone-200 bg-white px-4 py-2 xl:hidden" aria-label="القائمة">
          {NAV_LINKS.map((link) => (
            <a
              key={link.path}
              href={`#${link.path}`}
              className={`block rounded-xl px-4 py-3 text-base font-medium transition ${
                currentPath === link.path ? 'bg-teal-50 text-teal-800' : 'text-slate-700 hover:bg-stone-100 hover:text-teal-700'
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
