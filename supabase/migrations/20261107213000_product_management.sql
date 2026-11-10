/*
  Add authenticated product management and remove unverified sample pricing
  and rating data. Only users with app_metadata.role = 'admin' may manage products.
*/

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS asin text,
  ADD COLUMN IF NOT EXISTS amazon_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE products
  ADD CONSTRAINT products_asin_format CHECK (asin IS NULL OR asin ~ '^[A-Za-z0-9]{10}$'),
  ADD CONSTRAINT products_amazon_links_array CHECK (jsonb_typeof(amazon_links) = 'array');

UPDATE products
SET is_active = false,
    amazon_links = '[]'::jsonb;

ALTER TABLE products
  ADD CONSTRAINT products_active_requires_marketplace_link
    CHECK (NOT is_active OR jsonb_array_length(amazon_links) > 0);

ALTER TABLE products
  DROP COLUMN IF EXISTS price,
  DROP COLUMN IF EXISTS original_price,
  DROP COLUMN IF EXISTS rating,
  DROP COLUMN IF EXISTS reviews_count,
  DROP COLUMN IF EXISTS is_deal,
  DROP COLUMN IF EXISTS affiliate_url;

CREATE OR REPLACE FUNCTION public.is_catalog_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'admin', false);
$$;

DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_active_products" ON products FOR SELECT
  TO anon, authenticated
  USING (is_active OR public.is_catalog_admin());

CREATE POLICY "catalog_admin_insert_products" ON products FOR INSERT
  TO authenticated
  WITH CHECK (public.is_catalog_admin());

CREATE POLICY "catalog_admin_update_products" ON products FOR UPDATE
  TO authenticated
  USING (public.is_catalog_admin())
  WITH CHECK (public.is_catalog_admin());

CREATE POLICY "catalog_admin_delete_products" ON products FOR DELETE
  TO authenticated
  USING (public.is_catalog_admin());

GRANT SELECT ON products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON products TO authenticated;
