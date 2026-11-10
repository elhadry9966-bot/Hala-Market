import { useEffect } from 'react';
import type { ReactNode } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CookieNotice from '@/components/layout/CookieNotice';
import LoadError from '@/components/layout/LoadError';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { useCatalog } from '@/hooks/useCatalog';
import { STATIC_PAGES } from '@/content/staticPages';
import type { StaticPageKey } from '@/content/staticPages';
import { useRoute } from '@/lib/router';
import HomePage from '@/pages/HomePage';
import ProductsPage from '@/pages/ProductsPage';
import CategoriesPage from '@/pages/CategoriesPage';
import ProductPage from '@/pages/ProductPage';
import FavoritesPage from '@/pages/FavoritesPage';
import ContactPage from '@/pages/ContactPage';
import StaticPage from '@/pages/StaticPage';
import NotFoundPage from '@/pages/NotFoundPage';
import AdminPage from '@/pages/AdminPage';

const STATIC_ROUTES: Record<string, StaticPageKey> = {
  '/about': 'about',
  '/privacy': 'privacy',
  '/cookies': 'cookies',
  '/affiliate-disclosure': 'affiliate',
};

const CATALOG_ROUTES = new Set(['/', '/products', '/categories', '/favorites']);

function App() {
  const route = useRoute();
  const catalog = useCatalog({ includeStorefrontContent: route.path !== '/admin' });
  const isProductRoute = route.segments[0] === 'product' && route.segments.length === 2;
  const needsCatalog = CATALOG_ROUTES.has(route.path) || isProductRoute;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route.path]);

  const renderPage = (): ReactNode => {
    if (route.path === '/admin') return <AdminPage categories={catalog.categories} onCatalogReload={catalog.reload} />;

    const staticKey = STATIC_ROUTES[route.path];
    if (staticKey) return <StaticPage content={STATIC_PAGES[staticKey]} />;
    if (route.path === '/contact') return <ContactPage />;

    if (!needsCatalog) return <NotFoundPage />;
    if (catalog.status === 'error') return <LoadError message={catalog.errorMessage} onRetry={catalog.reload} />;

    switch (route.path) {
      case '/':
        return <HomePage banners={catalog.banners} categories={catalog.categories} products={catalog.products} isLoading={catalog.status === 'loading'} />;
      case '/products':
        return (
          <ProductsPage
            products={catalog.products}
            categories={catalog.categories}
            isLoading={catalog.status === 'loading'}
            query={route.params.get('q') ?? ''}
            categorySlug={route.params.get('category')}
          />
        );
      case '/categories':
        return <CategoriesPage categories={catalog.categories} products={catalog.products} />;
      case '/favorites':
        return <FavoritesPage products={catalog.products} isLoading={catalog.status === 'loading'} />;
      default:
        return (
          <ProductPage
            slug={route.segments[1]}
            products={catalog.products}
            categories={catalog.categories}
            isLoading={catalog.status === 'loading'}
          />
        );
    }
  };

  return (
    <FavoritesProvider>
      <div id="top" className="flex min-h-screen flex-col bg-stone-50">
        <Header currentPath={route.path} initialQuery={route.path === '/products' ? (route.params.get('q') ?? '') : ''} />
        <main className="flex-1">{renderPage()}</main>
        <Footer />
        <CookieNotice />
      </div>
    </FavoritesProvider>
  );
}

export default App;
