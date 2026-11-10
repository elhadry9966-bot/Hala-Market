import SectionHeading from '@/components/home/SectionHeading';
import { getCategoryIcon } from '@/lib/categoryIcons';
import { buildHash } from '@/lib/router';
import type { Category } from '@/types/catalog';

interface CategoryStripProps {
  categories: Category[];
}

export default function CategoryStrip({ categories }: CategoryStripProps) {
  if (categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 pt-14 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading id="categories" eyebrow="تسوق حسب الفئة" title="الأقسام" />
        <a href="#/categories" className="text-sm font-bold text-teal-700 transition hover:text-teal-900">
          كل التصنيفات
        </a>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {categories.map((category) => {
          const Icon = getCategoryIcon(category.icon);
          return (
            <a
              key={category.id}
              href={buildHash('/products', { category: category.slug })}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-center transition duration-300 hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg hover:shadow-teal-900/5"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700 transition group-hover:bg-teal-700 group-hover:text-white">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <span className="text-sm font-bold leading-snug text-slate-800">{category.name}</span>
            </a>
          );
        })}
      </div>
    </section>
  );
}
