import type { AnchorHTMLAttributes, MouseEventHandler, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface AmazonProductLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  productId: string;
  marketplace: string;
  href: string;
  children: ReactNode;
}

export default function AmazonProductLink({
  productId,
  marketplace,
  href,
  children,
  onClick,
  ...props
}: AmazonProductLinkProps) {
  const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    onClick?.(event);
    if (event.defaultPrevented) return;

    void supabase
      .from('product_clicks')
      .insert({ product_id: productId, marketplace })
      .then(({ error }) => {
        if (error) console.error('Failed to record product click:', error.message);
      });
  };

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
