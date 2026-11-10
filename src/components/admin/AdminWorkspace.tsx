import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Download, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Banner, Category, Product } from '@/types/catalog';

export type AdminSection = 'overview' | 'products' | 'categories' | 'banners' | 'amazon' | 'settings' | 'users' | 'reports';

interface AdminWorkspaceProps {
  section: Exclude<AdminSection, 'products'>;
  products: Product[];
  onEditProduct: (product: Product) => void;
  onCategoriesChanged: () => void;
}

interface StoreSetting {
  setting_key: string;
  setting_value: unknown;
  is_public: boolean;
}

interface ClickReportRow {
  report_date: string;
  product_id: string;
  product_title: string;
  marketplace: string;
  clicks: number;
}

interface ManagedUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  last_sign_in_at: string | null;
}

const fieldClass =
  'w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-600/10';
const buttonClass = 'inline-flex items-center gap-2 rounded-full bg-teal-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50';
const today = new Date().toISOString().slice(0, 10);
const monthAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const REPORT_PAGE_SIZE = 1000;

function errorText(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'تعذر تنفيذ العملية. تحقق من اتصال قاعدة البيانات وحاول مرة أخرى.';
}

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
}

function quoteCsv(value: string | number): string {
  let text = String(value);
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(rows: ClickReportRow[], startDate: string, endDate: string) {
  const lines = [
    ['التاريخ', 'المنتج', 'سوق أمازون', 'عدد النقرات'].map(quoteCsv).join(','),
    ...rows.map((row) =>
      [row.report_date, row.product_title, row.marketplace, row.clicks].map(quoteCsv).join(','),
    ),
  ];
  const blob = new Blob(['\uFEFF', lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `smart-market-click-report-${startDate}-${endDate}.csv`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      {description && <p className="text-sm text-slate-500">{description}</p>}
    </div>
  );
}

export default function AdminWorkspace({
  section,
  products,
  onEditProduct,
  onCategoriesChanged,
}: AdminWorkspaceProps) {
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [stats, setStats] = useState({ products: 0, categories: 0, clicks: 0 });
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [settings, setSettings] = useState<StoreSetting[]>([]);
  const [report, setReport] = useState<ClickReportRow[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [fromDate, setFromDate] = useState(monthAgo);
  const [toDate, setToDate] = useState(today);
  const [categoryEdit, setCategoryEdit] = useState<Category | null>(null);
  const [bannerEdit, setBannerEdit] = useState<Banner | null>(null);
  const [settingKey, setSettingKey] = useState('');
  const [settingValue, setSettingValue] = useState('""');
  const [settingPublic, setSettingPublic] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'user'>('user');

  const fail = (failure: unknown) => setError(errorText(failure));

  const loadCategories = async () => {
    const { data, error: queryError } = await supabase.from('categories').select('*').order('sort_order');
    if (queryError) throw queryError;
    setAllCategories((data ?? []) as Category[]);
  };

  const loadBanners = async () => {
    const { data, error: queryError } = await supabase.from('banners').select('*').order('sort_order');
    if (queryError) throw queryError;
    setBanners((data ?? []) as Banner[]);
  };

  const loadSettings = async () => {
    const { data, error: queryError } = await supabase.from('store_settings').select('*').order('setting_key');
    if (queryError) throw queryError;
    setSettings((data ?? []) as StoreSetting[]);
  };

  const loadUsers = async () => {
    const { data, error: functionError } = await supabase.functions.invoke('manage-users', { body: { action: 'list' } });
    if (functionError) throw functionError;
    if (!Array.isArray(data?.users)) throw new Error('استجابة إدارة المستخدمين غير صالحة.');
    setUsers(data.users as ManagedUser[]);
  };

  const fetchReport = useCallback(async (startDate: string, endDate: string) => {
    const allRows: ClickReportRow[] = [];
    for (let offset = 0; ; offset += REPORT_PAGE_SIZE) {
      const { data, error: queryError } = await supabase
        .rpc('get_admin_click_report', { p_start_date: startDate, p_end_date: endDate })
        .range(offset, offset + REPORT_PAGE_SIZE - 1);
      if (queryError) throw queryError;
      const batch = (data ?? []) as ClickReportRow[];
      allRows.push(...batch);
      if (batch.length < REPORT_PAGE_SIZE) return allRows;
    }
  }, []);

  const loadReport = useCallback(async () => {
    setReport(await fetchReport(fromDate, toDate));
  }, [fetchReport, fromDate, toDate]);

  useEffect(() => {
    let cancelled = false;
    setError('');
    const load = async () => {
      try {
        if (section === 'overview') {
          const [productCount, categoryCount, clickCount, rows] = await Promise.all([
            supabase.from('products').select('id', { count: 'exact', head: true }),
            supabase.from('categories').select('id', { count: 'exact', head: true }),
            supabase.from('product_clicks').select('id', { count: 'exact', head: true }),
            fetchReport(monthAgo, today),
          ]);
          if (productCount.error) throw productCount.error;
          if (categoryCount.error) throw categoryCount.error;
          if (clickCount.error) throw clickCount.error;
          if (cancelled) return;
          setStats({
            products: productCount.count ?? 0,
            categories: categoryCount.count ?? 0,
            clicks: clickCount.count ?? 0,
          });
          setReport(rows);
        } else if (section === 'categories') {
          await loadCategories();
        } else if (section === 'banners') {
          await loadBanners();
        } else if (section === 'settings') {
          await loadSettings();
        } else if (section === 'users') {
          await loadUsers();
        } else if (section === 'reports') {
          await loadReport();
        }
      } catch (loadError: unknown) {
        if (!cancelled) fail(loadError);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [section, refresh, loadReport, fetchReport]);

  const runSave = async (event: FormEvent<HTMLFormElement>, save: () => Promise<void>) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await save();
      setNotice('تم حفظ التغييرات بنجاح.');
      setRefresh((value) => value + 1);
    } catch (saveError: unknown) {
      fail(saveError);
    } finally {
      setBusy(false);
    }
  };

  const removeRow = async (table: 'categories' | 'banners' | 'store_settings', key: string, value: string) => {
    if (!window.confirm('هل تريد حذف هذا العنصر نهائياً؟')) return;
    setError('');
    setNotice('');
    try {
      const { error: deleteError } = await supabase.from(table).delete().eq(key, value);
      if (deleteError) throw deleteError;
      setNotice('تم الحذف بنجاح.');
      setRefresh((current) => current + 1);
      if (table === 'categories') onCategoriesChanged();
    } catch (deleteError: unknown) {
      fail(deleteError);
    }
  };

  const changeUserRole = async (userId: string, role: 'admin' | 'user') => {
    setError('');
    setNotice('');
    try {
      const { error: roleError } = await supabase.functions.invoke('manage-users', {
        body: { action: 'set-role', userId, role },
      });
      if (roleError) throw roleError;
      const { data: stillAdmin, error: authorizationError } = await supabase.rpc('is_catalog_admin');
      if (authorizationError) throw authorizationError;
      if (!stillAdmin) {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
        return;
      }
      setNotice('تم تحديث الصلاحية.');
      setRefresh((value) => value + 1);
    } catch (roleError: unknown) {
      fail(roleError);
    }
  };

  if (section === 'overview') {
    const topProducts = [...report]
      .reduce<{ product_id: string; title: string; clicks: number }[]>((items, row) => {
        const item = items.find((entry) => entry.product_id === row.product_id);
        if (item) item.clicks += Number(row.clicks);
        else items.push({ product_id: row.product_id, title: row.product_title, clicks: Number(row.clicks) });
        return items;
      }, [])
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);
    const total30Days = report.reduce((total, row) => total + Number(row.clicks), 0);

    return (
      <div className="space-y-7">
        <SectionTitle title="نظرة عامة" description="إحصائيات المتجر وأعلى المنتجات حصولاً على النقرات." />
        {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ['عدد المنتجات', stats.products],
            ['عدد التصنيفات', stats.categories],
            ['إجمالي النقرات', stats.clicks],
          ].map(([label, count]) => (
            <div key={label} className="rounded-2xl border border-stone-200 bg-white p-5">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{Number(count).toLocaleString('ar')}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h3 className="font-bold text-slate-900">الأكثر نقرًا خلال آخر 30 يومًا</h3>
          <p className="mt-1 text-xs text-slate-500">إجمالي نقرات الفترة: {total30Days.toLocaleString('ar')}</p>
          {topProducts.length ? (
            <ol className="mt-4 divide-y divide-stone-100">
              {topProducts.map((item, index) => (
                <li key={item.product_id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span className="truncate"><b className="ml-2 text-teal-700">{(index + 1).toLocaleString('ar')}.</b>{item.title}</span>
                  <b className="shrink-0">{item.clicks.toLocaleString('ar')} نقرة</b>
                </li>
              ))}
            </ol>
          ) : <p className="mt-4 text-sm text-slate-500">لا توجد نقرات مسجلة في هذه الفترة.</p>}
        </div>
      </div>
    );
  }

  if (section === 'categories') {
    const initial = categoryEdit ?? { id: '', slug: '', name: '', icon: 'Package', sort_order: allCategories.length + 1, is_active: true };
    return (
      <div className="space-y-6">
        <SectionTitle title="إدارة التصنيفات" description="أضف التصنيفات أو عدّلها أو عطّل ظهورها في المتجر." />
        {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
        <form className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-2" onSubmit={(event) => void runSave(event, async () => {
          const values = { slug: slugify(initial.slug || initial.name), name: initial.name.trim(), icon: initial.icon.trim() || 'Package', sort_order: Number(initial.sort_order), is_active: initial.is_active };
          if (!values.slug || !values.name) throw new Error('أدخل اسم التصنيف ورمزه.');
          const result = initial.id
            ? await supabase.from('categories').update(values).eq('id', initial.id)
            : await supabase.from('categories').insert(values);
          if (result.error) throw result.error;
          setCategoryEdit(null);
          onCategoriesChanged();
        })}>
          <input className={fieldClass} placeholder="اسم التصنيف" value={initial.name} onChange={(event) => setCategoryEdit({ ...initial, name: event.target.value })} required />
          <input className={fieldClass} placeholder="المعرّف (slug)" value={initial.slug} onChange={(event) => setCategoryEdit({ ...initial, slug: event.target.value })} />
          <input className={fieldClass} placeholder="اسم أيقونة Lucide مثل Package" value={initial.icon} onChange={(event) => setCategoryEdit({ ...initial, icon: event.target.value })} />
          <input className={fieldClass} type="number" min="0" placeholder="الترتيب" value={initial.sort_order} onChange={(event) => setCategoryEdit({ ...initial, sort_order: Number(event.target.value) })} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={initial.is_active} onChange={(event) => setCategoryEdit({ ...initial, is_active: event.target.checked })} /> ظاهر للزوار</label>
          <button disabled={busy} className={buttonClass} type="submit"><Save className="h-4 w-4" />{initial.id ? 'حفظ التصنيف' : 'إضافة تصنيف'}</button>
        </form>
        <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white px-4">
          {allCategories.map((category) => <li key={category.id} className="flex items-center gap-3 py-3 text-sm">
            <span className="min-w-0 flex-1 truncate font-bold">{category.name}<small className="mr-2 text-slate-400">{category.slug}</small></span>
            <span className="text-xs text-slate-500">{category.is_active ? 'ظاهر' : 'مخفي'}</span>
            <button type="button" aria-label={`تعديل ${category.name}`} onClick={() => setCategoryEdit(category)} className="rounded-full p-2 hover:bg-stone-100"><Pencil className="h-4 w-4" /></button>
            <button type="button" aria-label={`حذف ${category.name}`} onClick={() => void removeRow('categories', 'id', category.id)} className="rounded-full p-2 text-rose-700 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
          </li>)}
        </ul>
      </div>
    );
  }

  if (section === 'banners') {
    const initial = bannerEdit ?? { id: '', title: '', subtitle: '', image_url: '', cta_label: 'تسوق الآن', cta_url: '#/products', sort_order: banners.length + 1, is_active: true };
    return (
      <div className="space-y-6">
        <SectionTitle title="إدارة البنرات والعروض" description="تحكم في الشرائح الترويجية التي تظهر في الصفحة الرئيسية." />
        {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
        <form className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-2" onSubmit={(event) => void runSave(event, async () => {
          const values = { title: initial.title.trim(), subtitle: initial.subtitle.trim(), image_url: initial.image_url.trim(), cta_label: initial.cta_label.trim(), cta_url: initial.cta_url.trim(), sort_order: Number(initial.sort_order), is_active: initial.is_active };
          if (!values.title || !values.image_url || !values.cta_label || !/^(https:\/\/|#\/)/.test(values.cta_url)) throw new Error('أكمل بيانات البنر واستخدم رابط HTTPS أو رابطاً داخلياً يبدأ بـ #/.');
          const result = initial.id ? await supabase.from('banners').update(values).eq('id', initial.id) : await supabase.from('banners').insert(values);
          if (result.error) throw result.error;
          setBannerEdit(null);
        })}>
          <input className={fieldClass} placeholder="العنوان" value={initial.title} onChange={(event) => setBannerEdit({ ...initial, title: event.target.value })} required />
          <input className={fieldClass} placeholder="النص التوضيحي" value={initial.subtitle} onChange={(event) => setBannerEdit({ ...initial, subtitle: event.target.value })} />
          <input className={fieldClass} type="url" placeholder="رابط صورة HTTPS" value={initial.image_url} onChange={(event) => setBannerEdit({ ...initial, image_url: event.target.value })} required />
          <input className={fieldClass} placeholder="نص الزر" value={initial.cta_label} onChange={(event) => setBannerEdit({ ...initial, cta_label: event.target.value })} required />
          <input className={fieldClass} placeholder="رابط الزر: #/products أو HTTPS" value={initial.cta_url} onChange={(event) => setBannerEdit({ ...initial, cta_url: event.target.value })} required />
          <input className={fieldClass} type="number" min="0" placeholder="الترتيب" value={initial.sort_order} onChange={(event) => setBannerEdit({ ...initial, sort_order: Number(event.target.value) })} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={initial.is_active} onChange={(event) => setBannerEdit({ ...initial, is_active: event.target.checked })} /> مفعّل</label>
          <button disabled={busy} className={buttonClass} type="submit"><Plus className="h-4 w-4" />{initial.id ? 'حفظ البنر' : 'إضافة بنر'}</button>
        </form>
        <ul className="space-y-3">
          {banners.map((banner) => <li key={banner.id} className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3">
            <img src={banner.image_url} alt="" className="h-14 w-20 rounded-lg object-cover" />
            <span className="min-w-0 flex-1 truncate text-sm font-bold">{banner.title}<small className="block font-normal text-slate-500">{banner.is_active ? 'مفعّل' : 'معطّل'}</small></span>
            <button type="button" aria-label={`تعديل ${banner.title}`} onClick={() => setBannerEdit(banner)} className="rounded-full p-2 hover:bg-stone-100"><Pencil className="h-4 w-4" /></button>
            <button type="button" aria-label={`حذف ${banner.title}`} onClick={() => void removeRow('banners', 'id', banner.id)} className="rounded-full p-2 text-rose-700 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
          </li>)}
        </ul>
      </div>
    );
  }

  if (section === 'amazon') {
    return (
      <div className="space-y-5">
        <SectionTitle title="روابط أمازون" description="راجع الأسواق والروابط المرتبطة بالمنتجات، وعدّلها من نموذج المنتج." />
        {products.map((product) => <article key={product.id} className="rounded-2xl border border-stone-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="truncate font-bold">{product.title}</h3>
            <button type="button" onClick={() => onEditProduct(product)} className="shrink-0 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800">تعديل الروابط</button>
          </div>
          {(product.amazon_links ?? []).length ? <ul className="space-y-2">
            {product.amazon_links.map((link) => <li key={link.marketplace} className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-stone-100 px-2 py-1 font-bold">{link.marketplace}</span>
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-teal-700 underline" dir="ltr">{link.url}</a>
            </li>)}
          </ul> : <p className="text-sm text-slate-500">لا توجد روابط مسجلة.</p>}
        </article>)}
      </div>
    );
  }

  if (section === 'settings') {
    return (
      <div className="space-y-5">
        <SectionTitle title="إعدادات المتجر" description="تُخزن القيم بصيغة JSON؛ اختر ما إذا كان الإعداد متاحاً للواجهة العامة." />
        {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
        <form className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-2" onSubmit={(event) => void runSave(event, async () => {
          const key = settingKey.trim();
          if (!/^[a-z][a-z0-9_]{1,63}$/.test(key)) throw new Error('مفتاح الإعداد يجب أن يبدأ بحرف إنجليزي صغير ويحتوي على حروف أو أرقام أو شرطة سفلية.');
          let value: unknown;
          try { value = JSON.parse(settingValue); } catch { throw new Error('قيمة الإعداد ليست JSON صالحاً. استخدم علامات اقتباس حول النصوص.'); }
          const { error: saveError } = await supabase.from('store_settings').upsert({ setting_key: key, setting_value: value, is_public: settingPublic });
          if (saveError) throw saveError;
          setSettingKey('');
          setSettingValue('""');
          setSettingPublic(false);
        })}>
          <input className={fieldClass} placeholder="مفتاح الإعداد" value={settingKey} onChange={(event) => setSettingKey(event.target.value)} required />
          <textarea className={`${fieldClass} min-h-20 font-mono`} placeholder={'القيمة بصيغة JSON، مثال: "Smart Market"'} value={settingValue} onChange={(event) => setSettingValue(event.target.value)} required />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settingPublic} onChange={(event) => setSettingPublic(event.target.checked)} /> متاح للواجهة العامة</label>
          <button disabled={busy} className={buttonClass} type="submit"><Save className="h-4 w-4" />حفظ الإعداد</button>
        </form>
        <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white px-4">
          {settings.map((setting) => <li key={setting.setting_key} className="flex items-center gap-3 py-3 text-sm">
            <span className="min-w-0 flex-1 truncate"><b dir="ltr">{setting.setting_key}</b><small className="mr-2 text-slate-500">{JSON.stringify(setting.setting_value)}</small></span>
            <span className="text-xs text-slate-500">{setting.is_public ? 'عام' : 'خاص'}</span>
            <button type="button" aria-label={`حذف الإعداد ${setting.setting_key}`} onClick={() => void removeRow('store_settings', 'setting_key', setting.setting_key)} className="rounded-full p-2 text-rose-700 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
          </li>)}
        </ul>
      </div>
    );
  }

  if (section === 'users') {
    return (
      <div className="space-y-5">
        <SectionTitle title="المستخدمون والصلاحيات" description="أرسل دعوة بالبريد الإلكتروني وحدد صلاحية المدير أو المستخدم." />
        {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
        <form className="flex flex-wrap gap-3 rounded-2xl border border-stone-200 bg-white p-4" onSubmit={(event) => void runSave(event, async () => {
          const { error: inviteError } = await supabase.functions.invoke('manage-users', { body: { action: 'invite', email: inviteEmail, role: inviteRole } });
          if (inviteError) throw inviteError;
          setInviteEmail('');
          await loadUsers();
        })}>
          <input className={`${fieldClass} min-w-48 flex-1`} type="email" placeholder="البريد الإلكتروني" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} required />
          <select className={fieldClass} value={inviteRole} onChange={(event) => setInviteRole(event.target.value as 'admin' | 'user')}>
            <option value="user">مستخدم</option><option value="admin">مدير</option>
          </select>
          <button disabled={busy} className={buttonClass} type="submit"><Plus className="h-4 w-4" />دعوة مستخدم</button>
        </form>
        <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white px-4">
          {users.map((user) => <li key={user.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
            <span className="min-w-0 flex-1 truncate font-medium">{user.email}</span>
            <span className="text-xs text-slate-500">{user.last_sign_in_at ? 'سبق له تسجيل الدخول' : 'بانتظار الدعوة'}</span>
            <select
              aria-label={`صلاحية ${user.email}`}
              className="rounded-lg border border-stone-200 p-2 text-xs"
              value={user.role}
              onChange={(event) => void changeUserRole(user.id, event.target.value as 'admin' | 'user')}
            >
              <option value="user">مستخدم</option><option value="admin">مدير</option>
            </select>
          </li>)}
        </ul>
        <p className="text-xs text-slate-500">مفتاح الخدمة محفوظ في بيئة Supabase Edge Function ولا يُرسل إلى المتصفح.</p>
      </div>
    );
  }

  const submitReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (toDate < fromDate) {
      setError('تاريخ النهاية يجب أن يكون بعد تاريخ البداية.');
      return;
    }
    if ((new Date(`${toDate}T00:00:00Z`).getTime() - new Date(`${fromDate}T00:00:00Z`).getTime()) / 86400000 > 366) {
      setError('اختر فترة لا تتجاوز 367 يوماً.');
      return;
    }
    setError('');
    setBusy(true);
    try { await loadReport(); } catch (reportError: unknown) { fail(reportError); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <SectionTitle title="تقارير النقرات" description="صفّ النتائج حسب التاريخ ثم نزّلها كملف CSV." />
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      <form onSubmit={(event) => void submitReport(event)} className="flex flex-wrap items-end gap-3 rounded-2xl border border-stone-200 bg-white p-4">
        <label className="space-y-1 text-xs font-bold">من<input className={fieldClass} type="date" value={fromDate} max={today} onChange={(event) => setFromDate(event.target.value)} /></label>
        <label className="space-y-1 text-xs font-bold">إلى<input className={fieldClass} type="date" value={toDate} max={today} onChange={(event) => setToDate(event.target.value)} /></label>
        <button disabled={busy} className={buttonClass} type="submit">تطبيق الفلتر</button>
        <button disabled={!report.length} className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-4 py-2.5 text-sm font-bold disabled:opacity-50" type="button" onClick={() => downloadCsv(report, fromDate, toDate)}><Download className="h-4 w-4" />تصدير CSV</button>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-right text-sm">
          <thead className="bg-stone-50 text-slate-600"><tr><th className="p-3">التاريخ</th><th className="p-3">المنتج</th><th className="p-3">السوق</th><th className="p-3">النقرات</th></tr></thead>
          <tbody className="divide-y divide-stone-100">{report.map((row) => <tr key={`${row.report_date}-${row.product_id}-${row.marketplace}`}><td className="p-3" dir="ltr">{row.report_date}</td><td className="p-3">{row.product_title}</td><td className="p-3" dir="ltr">{row.marketplace}</td><td className="p-3">{Number(row.clicks).toLocaleString('ar')}</td></tr>)}</tbody>
        </table>
        {report.length === 0 && <p className="p-6 text-center text-sm text-slate-500">لا توجد نقرات في الفترة المختارة.</p>}
      </div>
    </div>
  );
}
