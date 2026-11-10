import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Boxes, ChartNoAxesCombined, ExternalLink, LayoutDashboard, LogOut, Megaphone, Pencil, Plus, Settings, Tags, Trash2, Users } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import AdminWorkspace from '@/components/admin/AdminWorkspace';
import type { AdminSection } from '@/components/admin/AdminWorkspace';
import { supabase } from '@/lib/supabase';
import type { AmazonLink, Category, Product } from '@/types/catalog';

interface AdminPageProps {
  categories: Category[];
  onCatalogReload: () => void;
}

interface ProductForm {
  title: string;
  description: string;
  image_url: string;
  asin: string;
  category_id: string;
  amazon_links: AmazonLink[];
  is_featured: boolean;
  is_active: boolean;
}

const MARKETPLACES = [
  { domain: 'amazon.com', label: 'الولايات المتحدة — Amazon.com' },
  { domain: 'amazon.co.uk', label: 'المملكة المتحدة — Amazon.co.uk' },
  { domain: 'amazon.ca', label: 'كندا — Amazon.ca' },
  { domain: 'amazon.com.au', label: 'أستراليا — Amazon.com.au' },
  { domain: 'amazon.de', label: 'ألمانيا — Amazon.de' },
  { domain: 'amazon.fr', label: 'فرنسا — Amazon.fr' },
  { domain: 'amazon.it', label: 'إيطاليا — Amazon.it' },
  { domain: 'amazon.es', label: 'إسبانيا — Amazon.es' },
  { domain: 'amazon.nl', label: 'هولندا — Amazon.nl' },
  { domain: 'amazon.se', label: 'السويد — Amazon.se' },
  { domain: 'amazon.pl', label: 'بولندا — Amazon.pl' },
  { domain: 'amazon.co.jp', label: 'اليابان — Amazon.co.jp' },
  { domain: 'amazon.in', label: 'الهند — Amazon.in' },
  { domain: 'amazon.ae', label: 'الإمارات — Amazon.ae' },
  { domain: 'amazon.sa', label: 'السعودية — Amazon.sa' },
  { domain: 'amazon.com.mx', label: 'المكسيك — Amazon.com.mx' },
  { domain: 'amazon.com.br', label: 'البرازيل — Amazon.com.br' },
  { domain: 'amazon.sg', label: 'سنغافورة — Amazon.sg' },
  { domain: 'amazon.com.be', label: 'بلجيكا — Amazon.com.be' },
  { domain: 'amazon.eg', label: 'مصر — Amazon.eg' },
];

const inputClass =
  'w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-600/10';

function emptyForm(categoryId: string): ProductForm {
  return {
    title: '',
    description: '',
    image_url: '',
    asin: '',
    category_id: categoryId,
    amazon_links: [],
    is_featured: false,
    is_active: false,
  };
}

function getErrorMessage(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '42703' &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.includes('products.is_active')
  ) {
    return 'مخطط قاعدة البيانات قديم. طبّق ترحيل Supabase الأخير قبل إدارة المنتجات.';
  }
  return error instanceof Error ? error.message : 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
}

function makeSlug(title: string): string {
  const base = title
    .trim()
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '');
  return `${base || 'product'}-${crypto.randomUUID().slice(0, 8)}`;
}

function validateAmazonLink(link: AmazonLink): string | null {
  try {
    const url = new URL(link.url);
    const market = MARKETPLACES.find((item) => item.domain === link.marketplace);
    if (url.protocol !== 'https:' || !market || ![market.domain, `www.${market.domain}`].includes(url.hostname)) {
      return 'استخدم رابط HTTPS أصلياً من سوق أمازون المختار.';
    }
    if (!/\/(?:dp|gp\/product)\/[A-Za-z0-9]{10}(?:\/|$)/i.test(url.pathname)) {
      return 'استخدم رابط صفحة المنتج على أمازون، وليس رابط بحث أو صفحة عامة.';
    }
    return null;
  } catch {
    return 'أدخل رابط أمازون صحيحاً لكل سوق.';
  }
}

const ADMIN_SECTIONS: { id: AdminSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'الرئيسية', icon: LayoutDashboard },
  { id: 'products', label: 'المنتجات', icon: Boxes },
  { id: 'categories', label: 'التصنيفات', icon: Tags },
  { id: 'banners', label: 'البنرات والعروض', icon: Megaphone },
  { id: 'amazon', label: 'روابط أمازون', icon: ExternalLink },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
  { id: 'users', label: 'المستخدمون', icon: Users },
  { id: 'reports', label: 'التقارير', icon: ChartNoAxesCombined },
];

export default function AdminPage({ categories, onCatalogReload }: AdminPageProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [adminCategories, setAdminCategories] = useState<Category[]>(categories);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(() => emptyForm(categories[0]?.id ?? ''));

  const usedMarketplaces = useMemo(() => new Set(form.amazon_links.map((link) => link.marketplace)), [form.amazon_links]);
  const availableMarketplaces = MARKETPLACES.filter((market) => !usedMarketplaces.has(market.domain));

  useEffect(() => {
    let active = true;
    if (!session) {
      setIsAdmin(false);
      return () => { active = false; };
    }

    setIsAdmin(null);
    void supabase.rpc('is_catalog_admin').then(
      ({ data, error: roleError }) => {
        if (!active) return;
        if (roleError) {
          setError(getErrorMessage(roleError));
          setIsAdmin(false);
          return;
        }
        setIsAdmin(data === true);
      },
      (roleError: unknown) => {
        if (!active) return;
        setError(getErrorMessage(roleError));
        setIsAdmin(false);
      },
    );

    return () => { active = false; };
  }, [session]);

  useEffect(() => {
    if (!form.category_id && adminCategories.length > 0) {
      setForm((current) => ({ ...current, category_id: adminCategories[0].id }));
    }
  }, [adminCategories, form.category_id]);

  useEffect(() => {
    let active = true;
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) setSession(nextSession);
    });

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!active) return;
        if (sessionError) setError(sessionError.message);
        setSession(data.session);
        setCheckingSession(false);
      })
      .catch((sessionError: unknown) => {
        if (!active) return;
        setError(getErrorMessage(sessionError));
        setCheckingSession(false);
      });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setProducts([]);
      return;
    }
    let cancelled = false;
    setLoadingProducts(true);
    void (async () => {
      try {
        const [productsResult, categoriesResult] = await Promise.all([
          supabase.from('products').select('*').order('created_at', { ascending: false }),
          supabase.from('categories').select('*').order('sort_order'),
        ]);
        if (productsResult.error) throw productsResult.error;
        if (categoriesResult.error) throw categoriesResult.error;
        if (!cancelled) {
          setProducts((productsResult.data ?? []) as Product[]);
          setAdminCategories((categoriesResult.data ?? []) as Category[]);
        }
      } catch (queryError: unknown) {
        if (!cancelled) setError(getErrorMessage(queryError));
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const startNewProduct = () => {
    setEditingId(null);
    setForm(emptyForm(adminCategories[0]?.id ?? ''));
    setError('');
    setNotice('');
  };

  const startEditing = (product: Product) => {
    setEditingId(product.id);
    setForm({
      title: product.title,
      description: product.description,
      image_url: product.image_url,
      asin: product.asin ?? '',
      category_id: product.category_id,
      amazon_links: product.amazon_links ?? [],
      is_featured: product.is_featured,
      is_active: product.is_active,
    });
    setError('');
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) setError(signInError.message);
    } catch (signInError: unknown) {
      setError(getErrorMessage(signInError));
    }
  };

  const handleSignOut = async () => {
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) setError(signOutError.message);
    } catch (signOutError: unknown) {
      setError(getErrorMessage(signOutError));
    }
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!form.title.trim() || !form.description.trim() || !form.category_id || !form.image_url.trim()) {
      setError('أكمل اسم المنتج ووصفه وصورته وتصنيفه.');
      return;
    }
    if (form.is_active && form.amazon_links.length === 0) {
      setError('أضف رابط أمازون موثقاً واحداً على الأقل قبل تفعيل المنتج.');
      return;
    }
    if (form.asin.trim() && !/^[A-Za-z0-9]{10}$/.test(form.asin.trim())) {
      setError('رقم ASIN يجب أن يتكون من 10 أحرف أو أرقام.');
      return;
    }
    if (!form.image_url.startsWith('https://')) {
      setError('يجب أن يكون رابط الصورة آمناً ويبدأ بـ HTTPS.');
      return;
    }
    const linkError = form.amazon_links.map((link) => validateAmazonLink({ ...link, url: link.url.trim() })).find(Boolean);
    if (linkError) {
      setError(linkError);
      return;
    }

    const existing = products.find((product) => product.id === editingId);
    const values = {
      slug: existing?.slug ?? makeSlug(form.title),
      title: form.title.trim(),
      description: form.description.trim(),
      image_url: form.image_url.trim(),
      asin: form.asin.trim().toUpperCase() || null,
      category_id: form.category_id,
      amazon_links: form.amazon_links.map((link) => ({ ...link, url: link.url.trim() })),
      is_featured: form.is_featured,
      is_active: form.is_active,
    };

    setSaving(true);
    try {
      const result = editingId
        ? await supabase.from('products').update(values).eq('id', editingId)
        : await supabase.from('products').insert(values);
      if (result.error) throw result.error;
      const { data, error: queryError } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (queryError) throw queryError;
      setProducts((data ?? []) as Product[]);
      startNewProduct();
      setNotice(editingId ? 'تم تحديث المنتج.' : 'تمت إضافة المنتج.');
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`هل تريد حذف «${product.title}» نهائياً؟`)) return;
    setError('');
    setNotice('');
    try {
      const { error: deleteError } = await supabase.from('products').delete().eq('id', product.id);
      if (deleteError) throw deleteError;
      setProducts((current) => current.filter((item) => item.id !== product.id));
      if (editingId === product.id) startNewProduct();
      setNotice('تم حذف المنتج.');
    } catch (deleteError: unknown) {
      setError(getErrorMessage(deleteError));
    }
  };

  const addMarketplace = () => {
    const market = availableMarketplaces[0];
    if (!market) return;
    setForm((current) => ({
      ...current,
      amazon_links: [...current.amazon_links, { marketplace: market.domain, url: '' }],
    }));
  };

  const refreshAdminCategories = async () => {
    const { data, error: categoriesError } = await supabase.from('categories').select('*').order('sort_order');
    if (categoriesError) {
      setError(getErrorMessage(categoriesError));
      return;
    }
    setAdminCategories((data ?? []) as Category[]);
    onCatalogReload();
  };

  if (checkingSession) {
    return <p className="mx-auto max-w-7xl px-4 py-20 text-center text-slate-500">جارٍ التحقق من الجلسة...</p>;
  }

  if (!session) {
    return (
      <>
        <PageHeader title="دخول لوحة التحكم" description="تسجيل الدخول متاح لحسابات الإدارة فقط." />
        <form onSubmit={handleSignIn} className="mx-auto my-12 max-w-md space-y-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <label className="block space-y-2 text-sm font-bold text-slate-700">
            البريد الإلكتروني
            <input className={inputClass} type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="block space-y-2 text-sm font-bold text-slate-700">
            كلمة المرور
            <input className={inputClass} type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
          <button type="submit" className="w-full rounded-full bg-teal-700 px-5 py-3 font-bold text-white transition hover:bg-teal-800">تسجيل الدخول</button>
          <p className="text-xs leading-relaxed text-slate-500">
            أنشئ الحساب من لوحة Supabase ثم عيّن <code>app_metadata.role</code> إلى <code>admin</code>. لا تمنح صلاحيات الإدارة من بيانات المستخدم القابلة للتعديل.
          </p>
        </form>
      </>
    );
  }

  if (isAdmin === null) {
    return <p className="mx-auto max-w-7xl px-4 py-20 text-center text-slate-500">{error || 'جارٍ التحقق من صلاحيات المدير...'}</p>;
  }

  if (!isAdmin) {
    return (
      <section className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-slate-900">ليس لديك صلاحية الإدارة</h1>
        <p className="mt-3 text-slate-600">يتطلب الوصول إضافة الحساب إلى جدول صلاحيات الإدارة في Supabase.</p>
        {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
        <button type="button" onClick={handleSignOut} className="mt-6 rounded-full bg-slate-900 px-5 py-2.5 font-bold text-white">تسجيل الخروج</button>
      </section>
    );
  }

  return (
    <>
      <PageHeader
        title="لوحة التحكم"
        description="إدارة منتجات المتجر ومحتواه ومتابعة الأداء."
        breadcrumbs={[{ label: 'الرئيسية', href: '#/' }, { label: 'لوحة التحكم' }]}
      />
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <nav className="no-scrollbar flex gap-2 overflow-x-auto pb-2" aria-label="أقسام لوحة التحكم">
          {ADMIN_SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              aria-current={activeSection === id ? 'page' : undefined}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition ${
                activeSection === id ? 'bg-teal-700 text-white' : 'bg-white text-slate-600 ring-1 ring-stone-200 hover:text-teal-700'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </button>
          ))}
          <button type="button" onClick={handleSignOut} aria-label="تسجيل الخروج" className="mr-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-300 bg-white text-slate-700">
            <LogOut className="h-4 w-4" aria-hidden />
          </button>
        </nav>

        {activeSection === 'products' ? (
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900">المنتجات ({products.length.toLocaleString('ar')})</h2>
            <div className="flex gap-2">
              <button type="button" onClick={startNewProduct} className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-4 py-2.5 text-sm font-bold text-white">
                <Plus className="h-4 w-4" aria-hidden /> منتج جديد
              </button>
              <button type="button" onClick={handleSignOut} aria-label="تسجيل الخروج" className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 text-slate-700">
                <LogOut className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
          {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
          {loadingProducts ? (
            <p className="py-8 text-slate-500">جارٍ تحميل المنتجات...</p>
          ) : products.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-slate-500">لا توجد منتجات بعد. أضف منتجاً للبدء.</p>
          ) : (
            <ul className="space-y-3">
              {products.map((product) => (
                <li key={product.id} className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 sm:gap-4 sm:p-4">
                  <img src={product.image_url} alt="" className="h-16 w-16 shrink-0 rounded-xl bg-stone-100 object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-900">{product.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {product.is_active ? 'مفعّل' : 'معطّل'} · {product.is_featured ? 'مميز' : 'عادي'} · {(product.amazon_links ?? []).length} رابط سوق
                    </p>
                  </div>
                  <button type="button" onClick={() => startEditing(product)} aria-label={`تعديل ${product.title}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-slate-700 hover:bg-teal-50 hover:text-teal-700">
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                  <button type="button" onClick={() => void handleDelete(product)} aria-label={`حذف ${product.title}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100">
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form onSubmit={handleSave} className="h-fit space-y-5 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold text-slate-900">{editingId ? 'تعديل منتج' : 'إضافة منتج'}</h2>
          <label className="block space-y-2 text-sm font-bold text-slate-700">
            اسم المنتج
            <input className={inputClass} maxLength={200} required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </label>
          <label className="block space-y-2 text-sm font-bold text-slate-700">
            وصف المنتج
            <textarea className={`${inputClass} min-h-28 resize-y`} maxLength={5000} required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          <label className="block space-y-2 text-sm font-bold text-slate-700">
            رابط الصورة (HTTPS)
            <input className={inputClass} type="url" required value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} />
          </label>
          <label className="block space-y-2 text-sm font-bold text-slate-700">
            التصنيف
            <select className={inputClass} required value={form.category_id} onChange={(event) => setForm({ ...form, category_id: event.target.value })}>
              <option value="" disabled>اختر التصنيف</option>
              {adminCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className="block space-y-2 text-sm font-bold text-slate-700">
            رقم ASIN (اختياري)
            <input className={inputClass} maxLength={10} value={form.asin} onChange={(event) => setForm({ ...form, asin: event.target.value })} placeholder="10 أحرف أو أرقام" />
          </label>

          <fieldset className="space-y-3">
            <legend className="text-sm font-bold text-slate-700">روابط أسواق أمازون</legend>
            {form.amazon_links.map((link, index) => (
              <div key={link.marketplace} className="space-y-2 rounded-xl bg-stone-50 p-3">
                <label className="block space-y-2 text-xs font-bold text-slate-600">
                  السوق
                  <select
                    className={inputClass}
                    value={link.marketplace}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      amazon_links: current.amazon_links.map((item, itemIndex) => itemIndex === index ? { ...item, marketplace: event.target.value } : item),
                    }))}
                  >
                    {MARKETPLACES.filter((market) => market.domain === link.marketplace || !usedMarketplaces.has(market.domain)).map((market) => (
                      <option key={market.domain} value={market.domain}>{market.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2 text-xs font-bold text-slate-600">
                  رابط المنتج الأصلي
                  <input
                    className={inputClass}
                    type="url"
                    required={form.is_active}
                    value={link.url}
                    placeholder={`https://www.${link.marketplace}/dp/...`}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      amazon_links: current.amazon_links.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item),
                    }))}
                  />
                </label>
                <button type="button" onClick={() => setForm((current) => ({ ...current, amazon_links: current.amazon_links.filter((_, itemIndex) => itemIndex !== index) }))} className="text-xs font-bold text-rose-700">
                  إزالة هذا الرابط
                </button>
              </div>
            ))}
            <button type="button" disabled={!availableMarketplaces.length} onClick={addMarketplace} className="rounded-full border border-stone-300 px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-50">
              إضافة رابط لسوق آخر
            </button>
          </fieldset>

          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={form.is_featured} onChange={(event) => setForm({ ...form, is_featured: event.target.checked })} className="h-4 w-4 accent-teal-700" />
            منتج مميز
          </label>
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} className="h-4 w-4 accent-teal-700" />
            تفعيل المنتج وعرضه للزوار
          </label>
          {form.is_active && form.amazon_links.length === 0 && (
            <p className="text-xs text-amber-700">أضف رابط سوق أمازون موثقاً لتتمكن من تفعيل المنتج.</p>
          )}
          <button disabled={saving || adminCategories.length === 0} type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-teal-700 px-5 py-3 font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60">
            <Plus className="h-4 w-4" aria-hidden />
            {saving ? 'جارٍ الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة المنتج'}
          </button>
        </form>
      </section>
        ) : (
          <AdminWorkspace
            section={activeSection}
            products={products}
            onEditProduct={(product) => {
              startEditing(product);
              setActiveSection('products');
            }}
            onCategoriesChanged={() => void refreshAdminCategories()}
          />
        )}
      </div>
    </>
  );
}
