import { useState } from 'react';
import { Cookie } from 'lucide-react';

const STORAGE_KEY = 'smart-market-cookie-consent';

export default function CookieNotice() {
  const [dismissed, setDismissed] = useState(() => window.localStorage.getItem(STORAGE_KEY) !== null);

  if (dismissed) return null;

  const accept = () => {
    window.localStorage.setItem(STORAGE_KEY, 'accepted');
    setDismissed(true);
  };

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-3xl animate-fadeIn flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl sm:flex-row sm:items-center">
      <div className="flex flex-1 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <Cookie className="h-5 w-5" aria-hidden />
        </span>
        <p className="text-sm leading-relaxed text-slate-600">
          نستخدم ملفات تعريف الارتباط لتحسين تجربتك وحفظ مفضلتك. تعرّف على التفاصيل في{' '}
          <a href="#/cookies" className="font-bold text-teal-700 underline-offset-4 hover:underline">
            سياسة ملفات تعريف الارتباط
          </a>
          .
        </p>
      </div>
      <button
        type="button"
        onClick={accept}
        className="shrink-0 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700"
      >
        موافق
      </button>
    </div>
  );
}
