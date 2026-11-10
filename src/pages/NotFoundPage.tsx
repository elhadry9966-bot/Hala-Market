import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-32 text-center sm:px-6">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
        <Compass className="h-7 w-7" aria-hidden />
      </span>
      <p className="text-lg font-bold text-slate-900">الصفحة غير موجودة</p>
      <p className="text-sm text-slate-500">الرابط الذي تبحث عنه غير متاح، ربما تغيّر عنوانه.</p>
      <a href="#/" className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800">
        العودة إلى الرئيسية
      </a>
    </div>
  );
}
