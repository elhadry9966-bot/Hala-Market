CREATE TABLE IF NOT EXISTS public.admin_memberships (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'user')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_memberships ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_memberships FROM anon, authenticated;

INSERT INTO public.admin_memberships (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE raw_app_meta_data ->> 'role' = 'admin'
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

CREATE OR REPLACE FUNCTION public.is_catalog_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_memberships
    WHERE user_id = (SELECT auth.uid())
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_catalog_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_catalog_admin() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_catalog_user_role(p_user_id uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  admin_count bigint;
BEGIN
  IF p_role IS NULL OR p_role NOT IN ('admin', 'user') THEN
    RAISE EXCEPTION 'Invalid user role' USING ERRCODE = '22023';
  END IF;

  LOCK TABLE public.admin_memberships IN EXCLUSIVE MODE;
  IF p_role = 'user' THEN
    SELECT count(*) INTO admin_count
    FROM public.admin_memberships
    WHERE role = 'admin';
    IF EXISTS (
      SELECT 1 FROM public.admin_memberships
      WHERE user_id = p_user_id AND role = 'admin'
    ) AND admin_count <= 1 THEN
      RAISE EXCEPTION 'At least one administrator must remain' USING ERRCODE = '23514';
    END IF;
    DELETE FROM public.admin_memberships WHERE user_id = p_user_id;
  ELSE
    INSERT INTO public.admin_memberships (user_id, role)
    VALUES (p_user_id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_catalog_user_role(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_catalog_user_role(uuid, text) TO service_role;

DROP POLICY IF EXISTS "public_read_active_products" ON public.products;
CREATE POLICY "public_read_active_products" ON public.products FOR SELECT
  TO anon, authenticated
  USING (is_active OR public.is_catalog_admin());

DROP POLICY IF EXISTS "catalog_admin_insert_products" ON public.products;
CREATE POLICY "catalog_admin_insert_products" ON public.products FOR INSERT
  TO authenticated WITH CHECK (public.is_catalog_admin());
DROP POLICY IF EXISTS "catalog_admin_update_products" ON public.products;
CREATE POLICY "catalog_admin_update_products" ON public.products FOR UPDATE
  TO authenticated USING (public.is_catalog_admin()) WITH CHECK (public.is_catalog_admin());
DROP POLICY IF EXISTS "catalog_admin_delete_products" ON public.products;
CREATE POLICY "catalog_admin_delete_products" ON public.products FOR DELETE
  TO authenticated USING (public.is_catalog_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;

DROP POLICY IF EXISTS "catalog_admin_manage_categories" ON public.categories;
CREATE POLICY "catalog_admin_manage_categories" ON public.categories FOR ALL
  TO authenticated USING (public.is_catalog_admin()) WITH CHECK (public.is_catalog_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;

DROP POLICY IF EXISTS "catalog_admin_manage_banners" ON public.banners;
CREATE POLICY "catalog_admin_manage_banners" ON public.banners FOR ALL
  TO authenticated USING (public.is_catalog_admin()) WITH CHECK (public.is_catalog_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.banners TO authenticated;

CREATE TABLE IF NOT EXISTS public.product_clicks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  marketplace text NOT NULL CHECK (char_length(marketplace) BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_clicks_created_at_idx ON public.product_clicks(created_at);
CREATE INDEX IF NOT EXISTS product_clicks_product_id_idx ON public.product_clicks(product_id);
ALTER TABLE public.product_clicks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.product_clicks FROM anon, authenticated;
GRANT INSERT (product_id, marketplace) ON public.product_clicks TO anon, authenticated;
GRANT USAGE ON SEQUENCE public.product_clicks_id_seq TO anon, authenticated;

DROP POLICY IF EXISTS "public_record_active_product_clicks" ON public.product_clicks;
CREATE POLICY "public_record_active_product_clicks" ON public.product_clicks FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.products p
      CROSS JOIN LATERAL jsonb_array_elements(p.amazon_links) AS links(link)
      WHERE p.id = product_clicks.product_id
        AND p.is_active
        AND links.link ->> 'marketplace' = product_clicks.marketplace
    )
  );

DROP POLICY IF EXISTS "catalog_admin_read_product_clicks" ON public.product_clicks;
CREATE POLICY "catalog_admin_read_product_clicks" ON public.product_clicks FOR SELECT
  TO authenticated USING (public.is_catalog_admin());
GRANT SELECT ON public.product_clicks TO authenticated;

CREATE TABLE IF NOT EXISTS public.store_settings (
  setting_key text PRIMARY KEY CHECK (setting_key ~ '^[a-z][a-z0-9_]{1,63}$'),
  setting_value jsonb NOT NULL,
  is_public boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_public_store_settings" ON public.store_settings;
CREATE POLICY "public_read_public_store_settings" ON public.store_settings FOR SELECT
  TO anon, authenticated USING (is_public OR public.is_catalog_admin());
DROP POLICY IF EXISTS "catalog_admin_manage_store_settings" ON public.store_settings;
CREATE POLICY "catalog_admin_manage_store_settings" ON public.store_settings FOR ALL
  TO authenticated USING (public.is_catalog_admin()) WITH CHECK (public.is_catalog_admin());
GRANT SELECT ON public.store_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.store_settings TO authenticated;

INSERT INTO public.store_settings (setting_key, setting_value, is_public) VALUES
  ('store_name', '"Smart Market"'::jsonb, true),
  ('store_description', '"منتجات مختارة وروابط مباشرة إلى أسواق أمازون."'::jsonb, true),
  ('support_email', '""'::jsonb, true),
  ('affiliate_disclosure', '"قد نحصل على عمولة عند الشراء عبر روابط الشراكة."'::jsonb, true)
ON CONFLICT (setting_key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_admin_click_report(p_start_date date, p_end_date date)
RETURNS TABLE (
  report_date date,
  product_id uuid,
  product_title text,
  marketplace text,
  clicks bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_catalog_admin() THEN
    RAISE EXCEPTION 'Administrator access required' USING ERRCODE = '42501';
  END IF;
  IF p_start_date IS NULL OR p_end_date IS NULL OR p_end_date < p_start_date OR p_end_date - p_start_date > 366 THEN
    RAISE EXCEPTION 'Invalid report date range' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT
    (c.created_at AT TIME ZONE 'UTC')::date,
    p.id,
    p.title,
    c.marketplace,
    count(*)::bigint
  FROM public.product_clicks c
  JOIN public.products p ON p.id = c.product_id
  WHERE c.created_at >= (p_start_date::timestamp AT TIME ZONE 'UTC')
    AND c.created_at < ((p_end_date + 1)::timestamp AT TIME ZONE 'UTC')
  GROUP BY 1, 2, 3, 4
  ORDER BY 1 DESC, 5 DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_click_report(date, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_click_report(date, date) TO authenticated;
