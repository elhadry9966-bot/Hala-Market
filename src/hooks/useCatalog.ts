import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Banner, Category, Product } from '@/types/catalog';

type LoadStatus = 'loading' | 'ready' | 'error';

interface CatalogState {
  status: LoadStatus;
  errorMessage: string;
  categories: Category[];
  products: Product[];
  banners: Banner[];
  reload: () => void;
}

interface CatalogOptions {
  includeStorefrontContent?: boolean;
}

function ensureArray<T>(data: unknown): T[] {
  if (!Array.isArray(data)) throw new Error('Unexpected response from the store');
  return data as T[];
}

function getCatalogErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '42703' &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.includes('products.is_active')
  ) {
    return 'مخطط قاعدة البيانات قديم. طبّق ترحيل Supabase الأخير لتمكين نظام المنتجات.';
  }
  return 'تعذر تحميل بيانات المتجر. تحقق من اتصال قاعدة البيانات وإعداداتها ثم أعد المحاولة.';
}

export function useCatalog({ includeStorefrontContent = true }: CatalogOptions = {}): CatalogState {
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [attempt, setAttempt] = useState(0);

  const reload = useCallback(() => {
    setStatus('loading');
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const categoriesResult = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        if (categoriesResult.error) throw categoriesResult.error;
        const visibleCategories = ensureArray<Category>(categoriesResult.data);
        const visibleCategoryIds = new Set(visibleCategories.map((category) => category.id));
        let allProducts: Product[] = [];
        let activeBanners: Banner[] = [];

        if (includeStorefrontContent) {
          const [productsResult, bannersResult] = await Promise.all([
            supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }),
            supabase.from('banners').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
          ]);
          if (productsResult.error) throw productsResult.error;
          if (bannersResult.error) throw bannersResult.error;
          allProducts = ensureArray<Product>(productsResult.data);
          activeBanners = ensureArray<Banner>(bannersResult.data);
        }

        if (cancelled) return;
        setCategories(visibleCategories);
        setProducts(allProducts.filter((product) => visibleCategoryIds.has(product.category_id)));
        setBanners(activeBanners);
        setErrorMessage('');
        setStatus('ready');
      } catch (error: unknown) {
        if (!cancelled) {
          setErrorMessage(getCatalogErrorMessage(error));
          setStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attempt, includeStorefrontContent]);

  return { status, errorMessage, categories, products, banners, reload };
}
