import { ShoppingBag } from 'lucide-react';

const QUICK_LINKS = [
  { label: 'الرئيسية', href: '#/' },
  { label: 'جميع المنتجات', href: '#/products' },
  { label: 'التصنيفات', href: '#/categories' },
  { label: 'المفضلة', href: '#/favorites' },
];

const INFO_LINKS = [
  { label: 'من نحن', href: '#/about' },
  { label: 'اتصل بنا', href: '#/contact' },
];

const LEGAL_LINKS = [
  { label: 'سياسة الخصوصية', href: '#/privacy' },
  { label: 'سياسة ملفات تعريف الارتباط', href: '#/cookies' },
  { label: 'سياسة الإفصاح عن التسويق بالعمولة', href: '#/affiliate-disclosure' },
];

function FooterLinks({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-bold text-white">{title}</h3>
      <ul className="space-y-2.5 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href} className="transition hover:text-white">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="mt-20 bg-slate-900 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="space-y-4 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white">
              <ShoppingBag className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-lg font-bold text-white">Smart Market</span>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-slate-400">
            نعرض معلومات المنتجات وروابطها إلى أسواق أمازون المختلفة، دون اختلاق أسعار أو تقييمات.
          </p>
        </div>

        <FooterLinks title="تسوق" links={QUICK_LINKS} />
        <FooterLinks title="الشركة" links={INFO_LINKS} />
        <FooterLinks title="القانونية" links={LEGAL_LINKS} />
      </div>

      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-center text-xs leading-relaxed text-slate-500 sm:px-6 lg:px-8">
          <p>
            Smart Market مشارك في برنامج الشركاء التابع لأمازون. قد نحصل على عمولة عند الشراء عبر الروابط دون أي تكلفة إضافية عليك.
            الأسعار والتوفر يُحدّدان على أمازون، يُرجى مراجعة صفحة المنتج هناك قبل الشراء.
          </p>
          <p>جميع الحقوق محفوظة © {new Date().getFullYear()} Smart Market</p>
        </div>
      </div>
    </footer>
  );
}
