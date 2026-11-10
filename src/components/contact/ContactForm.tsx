import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { CheckCircle2, Send, TriangleAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type SubmitStatus = 'idle' | 'sending' | 'success' | 'error';

interface FormValues {
  name: string;
  email: string;
  message: string;
}

const EMPTY_VALUES: FormValues = { name: '', email: '', message: '' };
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function validate(values: FormValues): string | null {
  if (!values.name.trim()) return 'يرجى كتابة اسمك.';
  if (values.name.trim().length > 100) return 'الاسم طويل جدا.';
  if (!EMAIL_PATTERN.test(values.email.trim()) || values.email.trim().length > 254) return 'يرجى إدخال بريد إلكتروني صحيح.';
  if (!values.message.trim()) return 'يرجى كتابة رسالتك.';
  if (values.message.trim().length > 2000) return 'الرسالة طويلة جدا (الحد 2000 حرف).';
  return null;
}

const inputClass =
  'w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-600/10';

export default function ContactForm() {
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [formError, setFormError] = useState<string | null>(null);

  const updateField = (field: keyof FormValues) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate(values);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    setStatus('sending');
    const { error } = await supabase.from('contact_messages').insert({
      name: values.name.trim(),
      email: values.email.trim(),
      message: values.message.trim(),
    });

    if (error) {
      setStatus('error');
      return;
    }
    setValues(EMPTY_VALUES);
    setStatus('success');
  };

  if (status === 'success') {
    return (
      <div className="flex animate-fadeIn flex-col items-center gap-4 rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-stone-200">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="text-lg font-bold text-slate-900">تم إرسال رسالتك</p>
          <p className="text-sm text-slate-500">شكرا لتواصلك معنا، سنرد عليك في أقرب وقت.</p>
        </div>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-800 transition hover:border-slate-900"
        >
          إرسال رسالة أخرى
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-700">الاسم</span>
          <input
            type="text"
            value={values.name}
            onChange={updateField('name')}
            maxLength={100}
            autoComplete="name"
            placeholder="اكتب اسمك"
            className={inputClass}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-bold text-slate-700">البريد الإلكتروني</span>
          <input
            type="email"
            value={values.email}
            onChange={updateField('email')}
            maxLength={254}
            autoComplete="email"
            placeholder="name@example.com"
            dir="ltr"
            className={`${inputClass} text-right`}
          />
        </label>
      </div>
      <label className="block space-y-2">
        <span className="text-sm font-bold text-slate-700">الرسالة</span>
        <textarea
          value={values.message}
          onChange={updateField('message')}
          maxLength={2000}
          rows={6}
          placeholder="كيف يمكننا مساعدتك؟"
          className={`${inputClass} resize-y`}
        />
      </label>

      {(formError || status === 'error') && (
        <div role="alert" className="flex items-start gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{formError ?? 'تعذر إرسال الرسالة الآن. يرجى المحاولة مرة أخرى.'}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-teal-900/20 transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Send className="h-4 w-4" aria-hidden />
        {status === 'sending' ? 'جارٍ الإرسال...' : 'إرسال الرسالة'}
      </button>
    </form>
  );
}
