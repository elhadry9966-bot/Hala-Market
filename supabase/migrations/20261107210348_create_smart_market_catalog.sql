/*
# Smart Market catalog: categories, products, and homepage banners

1. New Tables
- `categories`: product groups shown in the category strip and filters.
  - `id` (uuid, primary key), `slug` (unique), `name` (Arabic label), `icon` (Lucide icon name), `sort_order`.
- `products`: affiliate product listings.
  - `id`, `slug` (unique), `title`, `description`, `price`, `original_price` (shown as a struck-through price when higher than `price`), `rating`, `reviews_count`, `image_url`, `affiliate_url`, `badge` (optional label such as "الأكثر مبيعا"), `is_featured`, `is_deal`, `category_id` (references `categories`), `created_at`.
- `banners`: rotating promotional slides on the homepage.
  - `id`, `title`, `subtitle`, `image_url`, `cta_label`, `cta_url`, `sort_order`, `is_active`.

2. Modified Tables
- None.

3. Security
- Row Level Security is enabled on all three tables.
- The store is public and has no sign-in, so the anon and authenticated roles get SELECT only.
- No write access is granted to the browser; catalog changes are made by the store owner.

4. Seed Data
- Inserts 8 categories, 14 sample products, and 3 banners so the storefront is populated on first load.
- Seeds are idempotent: products use ON CONFLICT on slug, and banners are inserted only when the table is empty.
- Affiliate links are Amazon search links with a placeholder tag and should be replaced with real product links.

5. Important Notes
- Prices are stored as plain numbers; the currency is applied in the interface.
- Re-running this migration is safe.
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'Package',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  original_price numeric(10,2) CHECK (original_price IS NULL OR original_price >= 0),
  rating numeric(2,1) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  reviews_count integer NOT NULL DEFAULT 0 CHECK (reviews_count >= 0),
  image_url text NOT NULL,
  affiliate_url text NOT NULL,
  badge text,
  is_featured boolean NOT NULL DEFAULT false,
  is_deal boolean NOT NULL DEFAULT false,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_category_id_idx ON products(category_id);
CREATE INDEX IF NOT EXISTS products_featured_idx ON products(is_featured) WHERE is_featured;
CREATE INDEX IF NOT EXISTS products_deal_idx ON products(is_deal) WHERE is_deal;

CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  cta_label text NOT NULL DEFAULT 'تسوق الآن',
  cta_url text NOT NULL DEFAULT '#products',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON categories, products, banners TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_read_active_banners" ON banners;
CREATE POLICY "public_read_active_banners" ON banners FOR SELECT
  TO anon, authenticated USING (is_active);

INSERT INTO categories (slug, name, icon, sort_order) VALUES
  ('electronics', 'الإلكترونيات', 'Laptop', 1),
  ('fashion', 'الأزياء والأحذية', 'Shirt', 2),
  ('beauty', 'الجمال والعناية', 'Sparkles', 3),
  ('home', 'المنزل والمطبخ', 'House', 4),
  ('sports', 'الرياضة واللياقة', 'Dumbbell', 5),
  ('books', 'الكتب', 'BookOpen', 6),
  ('bags', 'الحقائب والسفر', 'Backpack', 7),
  ('gaming', 'الألعاب والترفيه', 'Gamepad2', 8)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (slug, title, description, price, original_price, rating, reviews_count, image_url, affiliate_url, badge, is_featured, is_deal, category_id) VALUES
  ('wireless-headphones-pro', 'سماعات لاسلكية بعزل ضوضاء فعال', 'سماعات بتقنية إلغاء الضوضاء النشط وبطارية تدوم حتى 30 ساعة مع شحن سريع.', 89.99, 129.99, 4.6, 12840, 'https://images.pexels.com/photos/7772548/pexels-photo-7772548.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'https://www.amazon.com/s?k=wireless+noise+cancelling+headphones&tag=smartmarket-20', 'الأكثر مبيعا', true, true, (SELECT id FROM categories WHERE slug = 'electronics')),
  ('laptop-slim-14', 'لابتوب نحيف بشاشة 14 بوصة', 'جهاز خفيف الوزن بمعالج سريع وذاكرة كافية للعمل والدراسة والتصميم الخفيف.', 649.00, 749.00, 4.5, 3290, 'https://images.pexels.com/photos/6968164/pexels-photo-6968164.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'https://www.amazon.com/s?k=slim+14+inch+laptop&tag=smartmarket-20', NULL, true, false, (SELECT id FROM categories WHERE slug = 'electronics')),
  ('mirrorless-camera-kit', 'كاميرا بدون مرآة مع عدسة كيت', 'كاميرا احترافية بمستشعر عالي الدقة وتصوير فيديو بجودة 4K لصناع المحتوى.', 549.00, 619.00, 4.7, 1860, 'https://images.pexels.com/photos/17801168/pexels-photo-17801168.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'https://www.amazon.com/s?k=mirrorless+camera+kit&tag=smartmarket-20', 'اختيار المحررين', true, false, (SELECT id FROM categories WHERE slug = 'electronics')),
  ('smartwatch-fit', 'ساعة ذكية لتتبع النشاط والصحة', 'تتبع الخطوات ونبض القلب والنوم مع شاشة واضحة ومقاومة للماء حتى 50 متر.', 59.99, 99.99, 4.4, 8705, 'https://images.pexels.com/photos/4426516/pexels-photo-4426516.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'https://www.amazon.com/s?k=smartwatch+fitness+tracker&tag=smartmarket-20', 'خصم خاص', false, true, (SELECT id FROM categories WHERE slug = 'sports')),
  ('running-sneakers-red', 'حذاء رياضي خفيف للجري', 'نعل مرن يمتص الصدمات ومقدمة تهوية مريحة للاستخدام اليومي والتمارين.', 74.50, 95.00, 4.3, 5420, 'https://images.pexels.com/photos/1027130/pexels-photo-1027130.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'https://www.amazon.com/s?k=running+sneakers&tag=smartmarket-20', NULL, true, true, (SELECT id FROM categories WHERE slug = 'fashion')),
  ('casual-sneakers-white', 'حذاء كاجوال أبيض يومي', 'تصميم عصري يتناسب مع الملابس اليومية، مصنوع من خامات متينة وسهلة التنظيف.', 49.99, NULL, 4.2, 2150, 'https://images.pexels.com/photos/29521391/pexels-photo-29521391.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'https://www.amazon.com/s?k=white+casual+sneakers&tag=smartmarket-20', NULL, false, false, (SELECT id FROM categories WHERE slug = 'fashion')),
  ('vitamin-c-serum', 'سيروم فيتامين C لإشراقة البشرة', 'تركيبة خفيفة تساعد على توحيد لون البشرة وتمنحها نضارة تدوم طوال اليوم.', 24.90, 34.00, 4.6, 9310, 'https://images.pexels.com/photos/16233812/pexels-photo-16233812.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'https://www.amazon.com/s?k=vitamin+c+serum&tag=smartmarket-20', 'الأكثر مبيعا', true, true, (SELECT id FROM categories WHERE slug = 'beauty')),
  ('gentle-cleanser-set', 'مجموعة منظفات يومية لطيفة', 'مجموعة متكاملة من غسول الوجه والكريم المرطب لجميع أنواع البشرة.', 32.00, NULL, 4.5, 4010, 'https://images.pexels.com/photos/16008945/pexels-photo-16008945.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'https://www.amazon.com/s?k=gentle+cleanser+set&tag=smartmarket-20', NULL, false, false, (SELECT id FROM categories WHERE slug = 'beauty')),
  ('non-stick-cookware-set', 'طقم أواني طهي غير لاصق', 'طقم من سبع قطع بطلاء غير لاصق مقاوم للخدش ومناسب لجميع أنواع المواقد.', 119.00, 159.00, 4.6, 6230, 'https://images.pexels.com/photos/12156176/pexels-photo-12156176.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'https://www.amazon.com/s?k=non+stick+cookware+set&tag=smartmarket-20', 'عرض محدود', true, true, (SELECT id FROM categories WHERE slug = 'home')),
  ('kitchen-essentials-kit', 'أدوات مطبخ أساسية', 'مجموعة أدوات يومية من الفولاذ المقاوم للصدأ لتجهيز الطعام بسهولة.', 27.50, NULL, 4.3, 1740, 'https://images.pexels.com/photos/5825352/pexels-photo-5825352.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'https://www.amazon.com/s?k=kitchen+essentials+utensils&tag=smartmarket-20', NULL, false, false, (SELECT id FROM categories WHERE slug = 'home')),
  ('adjustable-dumbbell', 'دمبل قابل للتعديل', 'وزن قابل للتعديل من 2 إلى 24 كغ يوفر تمارين القوة في المنزل بمساحة صغيرة.', 189.00, 229.00, 4.7, 2980, 'https://images.pexels.com/photos/32610333/pexels-photo-32610333.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'https://www.amazon.com/s?k=adjustable+dumbbell&tag=smartmarket-20', 'الأكثر تقييما', true, false, (SELECT id FROM categories WHERE slug = 'sports')),
  ('bestseller-novels-set', 'مجموعة روايات مختارة', 'مجموعة من أفضل الروايات العربية والعالمية بأغلفة فاخرة مناسبة للهدايا.', 45.00, 60.00, 4.8, 7650, 'https://images.pexels.com/photos/8200898/pexels-photo-8200898.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'https://www.amazon.com/s?k=best+novels+set&tag=smartmarket-20', NULL, false, true, (SELECT id FROM categories WHERE slug = 'books')),
  ('travel-backpack-30l', 'حقيبة ظهر للسفر 30 لتر', 'حقيبة مقاومة للماء بجيب مخصص للابتوب وتصميم مريح يوزع الوزن بتوازن.', 58.00, 72.00, 4.6, 5510, 'https://images.pexels.com/photos/33166918/pexels-photo-33166918.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'https://www.amazon.com/s?k=travel+backpack+30l&tag=smartmarket-20', NULL, true, false, (SELECT id FROM categories WHERE slug = 'bags')),
  ('wireless-game-controller', 'يد تحكم لاسلكية للألعاب', 'يد تحكم مريحة بتوصيل لاسلكي وإضاءة مخصصة ومدة بطارية طويلة للجلسات الطويلة.', 64.99, 79.99, 4.5, 3420, 'https://images.pexels.com/photos/19931377/pexels-photo-19931377.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'https://www.amazon.com/s?k=wireless+game+controller&tag=smartmarket-20', NULL, false, true, (SELECT id FROM categories WHERE slug = 'gaming'))
ON CONFLICT (slug) DO NOTHING;

INSERT INTO banners (title, subtitle, image_url, cta_label, cta_url, sort_order, is_active)
SELECT * FROM (VALUES
  ('عروض الإلكترونيات لهذا الأسبوع', 'خصومات تصل إلى 30% على السماعات واللابتوبات والكاميرات', 'https://images.pexels.com/photos/7007174/pexels-photo-7007174.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'اكتشف العروض', '#deals', 1, true),
  ('جهّز منزلك بأناقة', 'أدوات مطبخ وأواني طهي بجودة عالية وأسعار مميزة', 'https://images.pexels.com/photos/12156176/pexels-photo-12156176.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'تسوق المطبخ', '#category-home', 2, true),
  ('لياقتك تبدأ من هنا', 'ساعات ذكية ودمبلز وملابس رياضية تناسب كل مستوى', 'https://images.pexels.com/photos/4716814/pexels-photo-4716814.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'ابدأ التمرين', '#category-sports', 3, true)
) AS seed(title, subtitle, image_url, cta_label, cta_url, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM banners);
