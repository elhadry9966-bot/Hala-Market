import type { Product, SortOption } from '@/types/catalog';

export function formatCount(value: number): string {
  return new Intl.NumberFormat('ar', { notation: 'compact' }).format(value);
}

export function filterProducts(products: Product[], query: string, categoryId: string | null): Product[] {
  const normalizedQuery = query.trim().toLowerCase();
  return products.filter((product) => {
    if (categoryId && product.category_id !== categoryId) return false;
    if (!normalizedQuery) return true;
    return (
      product.title.toLowerCase().includes(normalizedQuery) ||
      product.description.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function sortProducts(products: Product[], sort: SortOption): Product[] {
  const sorted = [...products];
  switch (sort) {
    case 'newest':
      return sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
    case 'featured':
    default:
      return sorted.sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || b.created_at.localeCompare(a.created_at));
  }
}
