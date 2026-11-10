import { useEffect, useMemo, useState } from 'react';
import { SearchX } from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';
import ProductFilters from '@/components/products/ProductFilters';
import ProductSkeleton from '@/components/products/ProductSkeleton';
import PageHeader from '@/components/layout/PageHeader';
import { filterProducts, sortProducts } from '@/lib/catalog';
import { buildHash } from '@/lib/router';
import type { Category, Product, SortOption } from '@/types/catalog';

interface ProductsPageProps {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  query: string;
  categorySlug: string | null;
}

const PAGE_SIZE = 12;

export default function ProductsPage({ products, categories, isLoading, query, categorySlug }: ProductsPageProps) {
  const [sort, setSort] = useState<SortOption>('featured');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const activeCategory = categories.find((category) => category.slug === categorySlug) ?? null;
  const categoryId = activeCategory?.id ?? null;
  const trimmedQuery = query.trim();

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [trimmedQuery, categoryId, sort]);

  const results = useMemo(
    () => sortProducts(filterProducts(products, trimmedQuery, categoryId), sort),
    [products, trimmedQuery, categoryId, sort],
  );

  const visible = results.slice(0, visibleCount);
  const title = trimmedQuery
    ? `نتائج البحث عن "${trimmedQuery}"`
    : activeCategory?.name ?? 'جميع المنتجات';
  const hasFilters = trimmedQuery !== '' || categorySlug !== null;

  return (
    <>
      <PageHeader
        title={title}
        description="فلتر حسب القسم أو رتب النتائج بالطريقة التي تناسبك."
        breadcrumbs={[
          { label: 'الرئيسية', href: '#/' },
          { label: 'جميع المنتجات', href: '#/products' },
          ...(activeCategory ? [{ label: activeCategory.name }] : []),
        ]}
      />

      <section className="mx-auto max-w-7xl space-y-8 px-4 pb-8 sm:px-6 lg:px-8">
        <ProductFilters
          categories={categories}
          activeCategorySlug={categorySlug}
          query={trimmedQuery}
          sort={sort}
          onSortChange={setSort}
        />

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-slate-500">
              <SearchX className="h-7 w-7" aria-hidden />
            </span>
            <div className="space-y-1">
              <p className="text-lg font-bold text-slate-900">لا توجد منتجات مطابقة</p>
              <p className="text-sm text-slate-500">جرّب كلمات بحث مختلفة أو اختر قسما آخر.</p>
            </div>
            {hasFilters && (
              <a
                href={buildHash('/products')}
                className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800"
              >
                عرض كل المنتجات
              </a>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500">عدد النتائج: {results.length.toLocaleString('ar')}</p>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {visible.length < results.length && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-800 transition hover:border-slate-900 hover:bg-slate-900 hover:text-white"
                >
                  عرض المزيد
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
