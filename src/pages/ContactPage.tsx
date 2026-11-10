import { Clock, Mail, MessageSquare } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import ContactForm from '@/components/contact/ContactForm';

const INFO_ITEMS = [
  { icon: MessageSquare, title: 'استفسارات المنتجات', text: 'أسئلتك عن منتج معين أو عن اختياراتنا.' },
  { icon: Clock, title: 'وقت الرد', text: 'نرد عادة خلال يومي عمل.' },
  { icon: Mail, title: 'الشراكات', text: 'إن كنت علامة تجارية أو صانع محتوى، أخبرنا بذلك في رسالتك.' },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="اتصل بنا"
        description="يسعدنا سماع رأيك واقتراحاتك. أرسل لنا رسالتك وسنعود إليك."
        breadcrumbs={[{ label: 'الرئيسية', href: '#/' }, { label: 'اتصل بنا' }]}
      />

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-5 lg:px-8">
        <div className="space-y-4 lg:col-span-2">
          {INFO_ITEMS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="space-y-1">
                <h2 className="font-bold text-slate-900">{title}</h2>
                <p className="text-sm leading-relaxed text-slate-500">{text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-3">
          <ContactForm />
        </div>
      </section>
    </>
  );
}
