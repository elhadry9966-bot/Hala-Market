import { useEffect, useState } from 'react';

export interface Route {
  path: string;
  segments: string[];
  params: URLSearchParams;
}

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/';
  const [pathPart, query = ''] = raw.split('?');
  const path = `/${pathPart.replace(/^\/+|\/+$/g, '')}`.replace(/^\/$/, '/');
  const segments = path.split('/').filter(Boolean).map(safeDecode);
  return { path, segments, params: new URLSearchParams(query) };
}

function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function buildHash(path: string, params?: Record<string, string | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const search = query.toString();
  return `#${path}${search ? `?${search}` : ''}`;
}

export function productHref(slug: string): string {
  return `#/product/${encodeURIComponent(slug)}`;
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}
