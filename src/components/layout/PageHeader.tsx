interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
}

export default function PageHeader({ title, description, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="border-b border-stone-200 bg-white">
      <div className="mx-auto max-w-7xl space-y-3 px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="مسار التصفح">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              {breadcrumbs.map((crumb, index) => (
                <li key={`${crumb.label}-${index}`} className="flex items-center gap-2">
                  {index > 0 && <span aria-hidden>/</span>}
                  {crumb.href ? (
                    <a href={crumb.href} className="transition hover:text-teal-700">
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="font-medium text-slate-800" aria-current="page">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">{title}</h1>
        {description && <p className="max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">{description}</p>}
      </div>
    </div>
  );
}
