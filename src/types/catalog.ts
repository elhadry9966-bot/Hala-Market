export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  image_url: string;
  asin: string | null;
  amazon_links: AmazonLink[];
  badge: string | null;
  is_featured: boolean;
  is_active: boolean;
  category_id: string;
  created_at: string;
}

export interface AmazonLink {
  marketplace: string;
  url: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  cta_label: string;
  cta_url: string;
  sort_order: number;
  is_active: boolean;
}

export type SortOption = 'featured' | 'newest';
