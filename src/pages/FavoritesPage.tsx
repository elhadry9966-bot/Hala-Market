import { Heart } from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';
import PageHeader from '@/components/layout/PageHeader';
import { useFavorites } from '@/contexts/FavoritesContext';
import type { Product } from '@/types/catalog';

interface FavoritesPageProps {
  products: Product[];
  isLoading: boolean;
}

export default function FavoritesPage({ products, isLoading }: FavoritesPageProps) {
  const { favorites } = useFavorites();
  const saved = products.filter((product) => favorites.includes(product.slug));

  return (
    <>
      <PageHeader
        title="المفضلة"
        description="المنتجات التي حفظتها تظهر هنا على هذا الجهاز."
        breadcrumbs={[{ label: 'الرئيسية', href: '#/' }, { label: 'المفضلة' }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="skeleton h-64 rounded-3xl" />
        ) : saved.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
              <Heart className="h-7 w-7" aria-hidden />
            </span>
            <div className="space-y-1">
              <p className="text-lg font-bold text-slate-900">لم تحفظ أي منتج بعد</p>
              <p className="text-sm text-slate-500">اضغط على أيقونة القلب في أي منتج لإضافته إلى مفضلتك.</p>
            </div>
            <a href="#/products" className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800">
              تصفح المنتجات
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {saved.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
