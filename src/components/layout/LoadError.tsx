import { RefreshCw, TriangleAlert } from 'lucide-react';

interface LoadErrorProps {
  message: string;
  onRetry: () => void;
}

export default function LoadError({ message, onRetry }: LoadErrorProps) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-32 text-center sm:px-6">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
        <TriangleAlert className="h-7 w-7" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="text-lg font-bold text-slate-900">تعذر تحميل المتجر</p>
        <p className="text-sm text-slate-500">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800"
      >
        <RefreshCw className="h-4 w-4" aria-hidden />
        إعادة المحاولة
      </button>
    </div>
  );
}
