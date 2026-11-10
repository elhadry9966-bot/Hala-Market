/*
# Expand store categories, add new products, and add contact messages

1. New Tables
- `contact_messages`: messages submitted from the Contact page.
  - `id`, `name` (1-100 chars), `email`, `message` (1-2000 chars), `created_at`.

2. Modified Tables
- `categories`: new `is_active` flag (default true). Categories can be hidden without deleting them or their products.
  - Renamed and re-ordered the visible categories to match the store's sections: electronics and phones, fashion, home and kitchen, beauty and personal care, sports and fitness, games and entertainment, kids, watches and accessories.
  - Added the kids and watches and accessories categories.
  - The old "books" and "bags" categories are hidden (is_active = false). Their products are kept in the database.
- `products`: the travel backpack moved from the bags category to watches and accessories.
- `banners`: call-to-action links now point to the new category pages.

3. New Products
- Added 7 sample products (phone, men's jacket, women's dress, kids' blocks, kids' outfit, leather watch, polarized sunglasses) so each visible category has items.

4. Security
- Categories: the public SELECT policy now returns only active categories.
- Contact messages: RLS enabled. The anon and authenticated roles may only INSERT, and only when the name, email, and message pass format and length checks. Nobody can read, edit, or delete messages from the browser.

5. Important Notes
- Re-running this migration is safe: inserts use ON CONFLICT and updates are idempotent.
- No rows were deleted.
*/

ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (is_active);

UPDATE categories SET name = 'الإلكترونيات والموبايلات', icon = 'Smartphone', sort_order = 1 WHERE slug = 'electronics';
UPDATE categories SET name = 'الملابس والأزياء', icon = 'Shirt', sort_order = 2 WHERE slug = 'fashion';
UPDATE categories SET name = 'المنزل والمطبخ', icon = 'House', sort_order = 3 WHERE slug = 'home';
UPDATE categories SET name = 'الجمال والعناية الشخصية', icon = 'Sparkles', sort_order = 4 WHERE slug = 'beauty';
UPDATE categories SET name = 'الرياضة واللياقة', icon = 'Dumbbell', sort_order = 5 WHERE slug = 'sports';
UPDATE categories SET name = 'الألعاب والترفيه', icon = 'Gamepad2', sort_order = 6 WHERE slug = 'gaming';

INSERT INTO categories (slug, name, icon, sort_order, is_active) VALUES
  ('kids', 'مستلزمات الأطفال', 'Baby', 7, true),
  ('accessories', 'الساعات والإكسسوارات', 'Watch', 8, true)
ON CONFLICT (slug) DO NOTHING;

UPDATE categories SET is_active = false, sort_order = 9 WHERE slug = 'books';
UPDATE categories SET is_active = false, sort_order = 10 WHERE slug = 'bags';

UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'accessories')
WHERE slug = 'travel-backpack-30l';

INSERT INTO products (slug, title, description, price, original_price, rating, reviews_count, image_url, affiliate_url, badge, is_featured, is_deal, category_id) VALUES
  ('smartphone-5g-128', 'هاتف ذكي 5G بسعة 128 جيجابايت', 'شاشة سلسة بمعدل تحديث عالٍ وكاميرا رئيسية قوية وبطارية تكفي ليوم كامل من الاستخدام.', 379.00, 429.00, 4.5, 2310, 'https://images.pexels.com/photos/6373168/pexels-photo-6373168.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'https://www.amazon.com/s?k=5g+smartphone+128gb&tag=smartmarket-20', NULL, true, true, (SELECT id FROM categories WHERE slug = 'electronics')),
  ('men-winter-jacket', 'جاكيت شتوي رجالي مبطن', 'جاكيت خفيف الوزن بحشوة دافئة وغطاء مقاوم للرياح، مناسب للنزهات والاستخدام اليومي.', 79.90, 109.00, 4.4, 1980, 'https://images.pexels.com/photos/7026422/pexels-photo-7026422.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'https://www.amazon.com/s?k=men+winter+puffer+jacket&tag=smartmarket-20', NULL, false, true, (SELECT id FROM categories WHERE slug = 'fashion')),
  ('women-summer-dress', 'فستان صيفي نسائي خفيف', 'قماش ناعم يسمح بالتهوية وتصميم أنيق يناسب الأمسيات والنزهات الصيفية.', 34.99, NULL, 4.3, 1210, 'https://images.pexels.com/photos/6181955/pexels-photo-6181955.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'https://www.amazon.com/s?k=women+summer+dress&tag=smartmarket-20', NULL, false, false, (SELECT id FROM categories WHERE slug = 'fashion')),
  ('kids-building-blocks', 'مكعبات بناء تعليمية للأطفال', 'قطع ملونة آمنة للأطفال تنمّي المهارات الحركية والإبداع، مع صندوق تخزين مريح.', 29.99, 39.99, 4.7, 3150, 'https://images.pexels.com/photos/12955867/pexels-photo-12955867.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'https://www.amazon.com/s?k=kids+building+blocks&tag=smartmarket-20', 'مفضل الأهالي', true, true, (SELECT id FROM categories WHERE slug = 'kids')),
  ('kids-cotton-outfit', 'طقم قطني للأطفال', 'طقم من القطن الناعم يناسب بشرة الأطفال الحساسة، متوفر بألوان مبهجة.', 22.50, NULL, 4.4, 860, 'https://images.pexels.com/photos/5693888/pexels-photo-5693888.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'https://www.amazon.com/s?k=kids+cotton+outfit&tag=smartmarket-20', NULL, false, false, (SELECT id FROM categories WHERE slug = 'kids')),
  ('luxury-leather-watch', 'ساعة كلاسيكية بسوار جلدي', 'ساعة أنيقة بقرص واضح وسوار جلدي فاخر، مناسبة للمناسبات الرسمية واليومية.', 129.00, 159.00, 4.6, 1420, 'https://images.pexels.com/photos/16093243/pexels-photo-16093243.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'https://www.amazon.com/s?k=classic+leather+strap+watch&tag=smartmarket-20', 'اختيار المحررين', true, true, (SELECT id FROM categories WHERE slug = 'accessories')),
  ('polarized-sunglasses', 'نظارات شمسية مستقطبة', 'عدسات مستقطبة تقلل الوهج وتحمي العين من الأشعة فوق البنفسجية، مع إطار خفيف.', 39.99, 54.00, 4.5, 2740, 'https://images.pexels.com/photos/29538716/pexels-photo-29538716.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', 'https://www.amazon.com/s?k=polarized+sunglasses&tag=smartmarket-20', NULL, false, true, (SELECT id FROM categories WHERE slug = 'accessories'))
ON CONFLICT (slug) DO NOTHING;

UPDATE banners SET cta_url = '#/products?category=electronics' WHERE cta_url = '#deals';
UPDATE banners SET cta_url = '#/products?category=home' WHERE cta_url = '#category-home';
UPDATE banners SET cta_url = '#/products?category=sports' WHERE cta_url = '#category-sports';

CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254 AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON contact_messages TO anon, authenticated;

DROP POLICY IF EXISTS "public_insert_contact_messages" ON contact_messages;
CREATE POLICY "public_insert_contact_messages" ON contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(name) BETWEEN 1 AND 100
    AND char_length(email) BETWEEN 3 AND 254
    AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND char_length(message) BETWEEN 1 AND 2000
  );
