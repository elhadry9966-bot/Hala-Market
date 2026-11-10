import { Package } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { getCategoryIcon } from '@/lib/categoryIcons';
import { buildHash } from '@/lib/router';
import type { Category, Product } from '@/types/catalog';

interface CategoriesPageProps {
  categories: Category[];
  products: Product[];
}

export default function CategoriesPage({ categories, products }: CategoriesPageProps) {
  return (
    <>
      <PageHeader
        title="التصنيفات"
        description="اختر القسم الذي تبحث عنه وتصفح أفضل منتجاته المختارة."
        breadcrumbs={[{ label: 'الرئيسية', href: '#/' }, { label: 'التصنيفات' }]}
      />

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
        {categories.map((category) => {
          const Icon = getCategoryIcon(category.icon);
          const categoryProducts = products.filter((product) => product.category_id === category.id);
          const cover = categoryProducts[0]?.image_url;

          return (
            <a
              key={category.id}
              href={buildHash('/products', { category: category.slug })}
              className="group relative overflow-hidden rounded-3xl border border-stone-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-stone-100">
                {cover ? (
                  <img
                    src={cover}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-slate-300">
                    <Package className="h-12 w-12" aria-hidden />
                  </span>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" aria-hidden />
              </div>
              <div className="flex items-center gap-4 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 transition group-hover:bg-teal-700 group-hover:text-white">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-slate-900 group-hover:text-teal-700">{category.name}</h2>
                  <p className="text-sm text-slate-500">{categoryProducts.length.toLocaleString('ar')} منتج</p>
                </div>
              </div>
            </a>
          );
        })}
      </section>
    </>
  );
}
