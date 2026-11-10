import { ExternalLink, SearchX, ShieldAlert } from 'lucide-react';
import FavoriteButton from '@/components/products/FavoriteButton';
import AmazonProductLink from '@/components/products/AmazonProductLink';
import ProductCard from '@/components/products/ProductCard';
import PageHeader from '@/components/layout/PageHeader';
import SectionHeading from '@/components/home/SectionHeading';
import { buildHash } from '@/lib/router';
import type { Category, Product } from '@/types/catalog';

interface ProductPageProps {
  slug: string;
  products: Product[];
  categories: Category[];
  isLoading: boolean;
}

const RELATED_LIMIT = 4;

export default function ProductPage({ slug, products, categories, isLoading }: ProductPageProps) {
  const product = products.find((item) => item.slug === slug);

  if (!product && isLoading) {
    return (
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="skeleton aspect-[4/3] rounded-3xl lg:aspect-auto lg:min-h-[480px]" />
        <div className="space-y-4">
          <div className="skeleton h-8 w-3/4 rounded-full" />
          <div className="skeleton h-5 w-1/3 rounded-full" />
          <div className="skeleton h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-32 text-center sm:px-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-slate-500">
          <SearchX className="h-7 w-7" aria-hidden />
        </span>
        <p className="text-lg font-bold text-slate-900">هذا المنتج غير متوفر</p>
        <p className="text-sm text-slate-500">ربما أُزيل من المتجر أو تغيّر رابطه.</p>
        <a href="#/products" className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800">
          تصفح المنتجات
        </a>
      </div>
    );
  }

  const category = categories.find((item) => item.id === product.category_id);
  const amazonLinks = product.amazon_links;
  const related = products
    .filter((item) => item.category_id === product.category_id && item.id !== product.id)
    .slice(0, RELATED_LIMIT);

  return (
    <>
      <PageHeader
        title={product.title}
        breadcrumbs={[
          { label: 'الرئيسية', href: '#/' },
          { label: 'جميع المنتجات', href: '#/products' },
          ...(category ? [{ label: category.name, href: buildHash('/products', { category: category.slug }) }] : []),
          { label: product.title },
        ]}
      />

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm lg:aspect-auto lg:min-h-[480px]">
          <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" />
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            {category && (
              <a
                href={buildHash('/products', { category: category.slug })}
                className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700 transition hover:bg-teal-100"
              >
                {category.name}
              </a>
            )}
            {product.badge && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{product.badge}</span>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold leading-snug text-slate-900 sm:text-3xl">{product.title}</h2>
          </div>

          <p className="text-base leading-relaxed text-slate-600">{product.description}</p>

          <div className="space-y-3 pt-2">
            {amazonLinks.map((link) => (
              <AmazonProductLink
                productId={product.id}
                marketplace={link.marketplace}
                key={link.marketplace}
                href={link.url}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-teal-700 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-900/20 transition hover:-translate-y-0.5 hover:bg-teal-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-600/30"
              >
                الشراء عبر أمازون {link.marketplace}
                <ExternalLink className="h-4 w-4" aria-hidden />
              </AmazonProductLink>
            ))}
            <FavoriteButton slug={product.slug} variant="full" />
            <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-400">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              رابط شراكة: قد نحصل على عمولة دون أي تكلفة إضافية عليك. السعر والتوفر يُحدّدان على أمازون.
            </p>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl space-y-8 px-4 pb-16 sm:px-6 lg:px-8">
          <SectionHeading id="related" eyebrow="قد يعجبك أيضا" title="منتجات مشابهة" />
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
