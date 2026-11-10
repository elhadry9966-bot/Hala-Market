import { useMemo } from 'react';
import { BadgeCheck, ShieldCheck, Tag } from 'lucide-react';
import HeroBanner from '@/components/home/HeroBanner';
import CategoryStrip from '@/components/home/CategoryStrip';
import ProductShowcase from '@/components/home/ProductShowcase';
import type { Banner, Category, Product } from '@/types/catalog';

interface HomePageProps {
  banners: Banner[];
  categories: Category[];
  products: Product[];
  isLoading: boolean;
}

const TRUST_ITEMS = [
  { icon: Tag, text: 'روابط مباشرة إلى أمازون' },
  { icon: BadgeCheck, text: 'معلومات المنتجات بوضوح' },
  { icon: ShieldCheck, text: 'شراء آمن عبر أمازون' },
];

export default function HomePage({ banners, categories, products, isLoading }: HomePageProps) {
  const featured = useMemo(() => products.filter((product) => product.is_featured), [products]);

  return (
    <>
      <div className="pb-2">
        {isLoading ? (
          <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
            <div className="skeleton h-[360px] rounded-3xl sm:h-[420px] lg:h-[480px]" />
          </div>
        ) : (
          <HeroBanner banners={banners} />
        )}
      </div>

      <div className="mx-auto mt-6 grid max-w-7xl grid-cols-1 gap-3 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
        {TRUST_ITEMS.map(({ icon: Icon, text }) => (
          <div
            key={text}
            className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-slate-700"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            {text}
          </div>
        ))}
      </div>

      <CategoryStrip categories={categories} />

      <ProductShowcase
        id="featured"
        eyebrow="اختيارات المحررين"
        title="المنتجات المميزة"
        description="منتجات مميزة أضيفت إلى المتجر."
        products={featured}
      />
    </>
  );
}
