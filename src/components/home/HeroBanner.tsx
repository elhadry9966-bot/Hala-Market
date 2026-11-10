import { useEffect, useState } from 'react';
import { ChevronLeft, Sparkles } from 'lucide-react';

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  cta_label: string;
  cta_url: string;
}

interface HeroBannerProps {
  banners: HeroSlide[];
}

const AUTOPLAY_MS = 6000;

function isExternal(url: string) {
  return /^https?:\/\//.test(url);
}

export default function HeroBanner({ banners }: HeroBannerProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = banners.length;

  useEffect(() => {
    if (count < 2 || paused) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % count), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  if (count === 0) return null;

  const current = banners[index % count];
  const goTo = (next: number) => setIndex((next + count) % count);

  return (
    <section
      className="relative mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8"
      aria-roledescription="carousel"
      aria-label="بانرات العروض"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative h-[360px] overflow-hidden rounded-3xl bg-slate-900 shadow-xl sm:h-[420px] lg:h-[480px]">
        <img
          key={current.id}
          src={current.image_url}
          alt=""
          className="absolute inset-0 h-full w-full animate-fadeIn object-cover"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-slate-900/85 via-slate-900/40 to-slate-900/10" aria-hidden />

        <div key={`text-${current.id}`} className="absolute inset-0 flex items-end p-6 sm:p-10 lg:p-14">
          <div className="max-w-xl animate-fadeIn space-y-4 text-white">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              عروض مختارة
            </span>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">{current.title}</h1>
            <p className="text-base leading-relaxed text-slate-200 sm:text-lg">{current.subtitle}</p>
            <a
              href={current.cta_url}
              {...(isExternal(current.cta_url) ? { target: '_blank', rel: 'sponsored noopener noreferrer' } : {})}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-teal-50 hover:shadow-xl active:translate-y-0"
            >
              {current.cta_label}
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </div>

        {count > 1 && (
          <div className="absolute bottom-5 left-6 flex gap-2 sm:bottom-6 sm:left-auto sm:right-10 lg:right-14">
            {banners.map((banner, dotIndex) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => goTo(dotIndex)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  dotIndex === index ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`الانتقال إلى الشريحة ${dotIndex + 1}`}
                aria-current={dotIndex === index}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
