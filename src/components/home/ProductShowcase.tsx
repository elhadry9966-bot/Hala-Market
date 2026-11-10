import ProductCard from '@/components/products/ProductCard';
import SectionHeading from '@/components/home/SectionHeading';
import type { Product } from '@/types/catalog';

interface ProductShowcaseProps {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  products: Product[];
}

const MAX_ITEMS = 8;

export default function ProductShowcase({ id, eyebrow, title, description, products }: ProductShowcaseProps) {
  if (products.length === 0) return null;

  return (
    <section id={id} className="mx-auto max-w-7xl scroll-mt-24 space-y-8 px-4 pt-14 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading id={`${id}-heading`} eyebrow={eyebrow} title={title} description={description} />
        <a href="#/products" className="text-sm font-bold text-teal-700 transition hover:text-teal-900">
          عرض جميع المنتجات
        </a>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {products.slice(0, MAX_ITEMS).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
