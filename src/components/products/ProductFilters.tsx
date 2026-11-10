import type { Category, SortOption } from '@/types/catalog';
import { buildHash } from '@/lib/router';

interface ProductFiltersProps {
  categories: Category[];
  activeCategorySlug: string | null;
  query: string;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'featured', label: 'الأكثر ملاءمة' },
  { value: 'newest', label: 'الأحدث' },
];

const chipBase = 'shrink-0 rounded-full px-4 py-2 text-sm font-bold transition';
const chipActive = 'bg-slate-900 text-white shadow-md';
const chipIdle = 'bg-white text-slate-600 ring-1 ring-stone-200 hover:text-slate-900 hover:ring-stone-300';

export default function ProductFilters({ categories, activeCategorySlug, query, sort, onSortChange }: ProductFiltersProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <a
          href={buildHash('/products', { q: query || undefined })}
          aria-current={activeCategorySlug === null ? 'page' : undefined}
          className={`${chipBase} ${activeCategorySlug === null ? chipActive : chipIdle}`}
        >
          الكل
        </a>
        {categories.map((category) => (
          <a
            key={category.id}
            href={buildHash('/products', { category: category.slug, q: query || undefined })}
            aria-current={activeCategorySlug === category.slug ? 'page' : undefined}
            className={`${chipBase} ${activeCategorySlug === category.slug ? chipActive : chipIdle}`}
          >
            {category.name}
          </a>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor="product-sort" className="shrink-0 text-sm font-medium text-slate-500">
          ترتيب حسب
        </label>
        <select
          id="product-sort"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as SortOption)}
          className="h-10 rounded-full border border-stone-200 bg-white px-4 text-sm font-medium text-slate-700 focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-600/10"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
