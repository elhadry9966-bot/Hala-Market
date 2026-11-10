# إعداد لوحة التحكم

## تطبيق تغييرات قاعدة البيانات

طبّق الترحيلات بالترتيب من مجلد `migrations`، بعد ترحيلات إنشاء المتجر الحالية:

1. `20261107213000_product_management.sql`
2. `20261107215000_admin_dashboard.sql`

يعطّل ترحيل المنتجات المنتجات التجريبية القديمة حتى تُراجع روابط أمازون وتُضاف من لوحة الإدارة.

## إنشاء أول مدير

أنشئ حساباً موثوقاً من Supabase Auth، ثم شغّل في SQL Editor بعد تطبيق الترحيلات، مع استبدال البريد بعنوان الحساب:

```sql
INSERT INTO public.admin_memberships (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admin@example.com'
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
```

لا تمنح دور المدير من بيانات الملف الشخصي القابلة للتعديل. جدول الصلاحيات لا يتيح القراءة أو الكتابة من المتصفح.

## نشر إدارة المستخدمين

انشر `functions/manage-users` كـ Supabase Edge Function، واضبط أسرارها في إعدادات Supabase Functions، لا في ملفات `VITE_*`:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_ORIGIN` بعنوان الموقع المنشور، مثلاً `https://example.com`

تحتاج دعوات المستخدمين إلى إعداد البريد الإلكتروني في Supabase Auth. مفتاح `SUPABASE_SERVICE_ROLE_KEY` مخصص للـ Edge Function ولا يجوز تضمينه في التطبيق الأمامي.

بعدها سجّل الدخول من `#/admin`. إدارة المنتجات والتصنيفات والبنرات والإعدادات والتقارير تعمل بصلاحيات RLS، بينما تمر إدارة المستخدمين عبر الـ Edge Function.
