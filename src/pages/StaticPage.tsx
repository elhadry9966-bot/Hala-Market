import PageHeader from '@/components/layout/PageHeader';
import type { StaticPageContent } from '@/content/staticPages';

interface StaticPageProps {
  content: StaticPageContent;
}

export default function StaticPage({ content }: StaticPageProps) {
  return (
    <>
      <PageHeader
        title={content.title}
        description={content.intro}
        breadcrumbs={[{ label: 'الرئيسية', href: '#/' }, { label: content.title }]}
      />
      <article className="mx-auto max-w-3xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
        {content.sections.map((section) => (
          <section key={section.heading} className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="leading-relaxed text-slate-600">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </article>
    </>
  );
}
