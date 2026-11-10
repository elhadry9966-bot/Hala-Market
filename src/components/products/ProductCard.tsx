import { ExternalLink } from 'lucide-react';
import FavoriteButton from '@/components/products/FavoriteButton';
import AmazonProductLink from '@/components/products/AmazonProductLink';
import { productHref } from '@/lib/router';
import type { Product } from '@/types/catalog';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const detailsHref = productHref(product.slug);
  const amazonLink = product.amazon_links[0];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-slate-900/5">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        <a href={detailsHref} className="block h-full w-full" aria-label={`عرض تفاصيل ${product.title}`}>
          <img
            src={product.image_url}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </a>
        {product.badge && (
          <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-teal-700 shadow-sm">
            {product.badge}
          </span>
        )}
        <div className="absolute bottom-3 left-3">
          <FavoriteButton slug={product.slug} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <a href={detailsHref} className="group/title">
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-slate-900 transition group-hover/title:text-teal-700">
            {product.title}
          </h3>
        </a>

        <div className="mt-auto flex items-end justify-end pt-2">
          {amazonLink && (
            <AmazonProductLink
              productId={product.id}
              marketplace={amazonLink.marketplace}
              href={amazonLink.url}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-teal-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-600/30"
            >
              تسوق عبر {amazonLink.marketplace}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </AmazonProductLink>
          )}
        </div>
      </div>
    </article>
  );
}
