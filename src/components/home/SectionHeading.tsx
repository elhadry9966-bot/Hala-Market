interface SectionHeadingProps {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
}

export default function SectionHeading({ id, eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div id={id} className="scroll-mt-24 space-y-2">
      <p className="text-sm font-bold text-teal-700">{eyebrow}</p>
      <h2 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">{title}</h2>
      {description && <p className="max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">{description}</p>}
    </div>
  );
}
