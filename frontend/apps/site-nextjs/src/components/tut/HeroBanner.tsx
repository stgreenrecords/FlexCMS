/** tut/hero-banner — full-width hero section with background image, headline and CTA. */
export function HeroBanner({ data }: { data: Record<string, unknown> }) {
  const title = data.title as string | undefined;
  const subtitle = data.subtitle as string | undefined;
  const backgroundImage = data.backgroundImage as string | undefined;
  const ctaLabel = data.ctaLabel as string | undefined;
  const ctaLink = data.ctaLink as string | undefined;
  const theme = (data.theme as string | undefined) ?? 'dark';
  const height = (data.height as string | undefined) ?? 'full';
  const overlayOpacity = (data.overlayOpacity as number | undefined) ?? 0.4;

  const textColor = theme === 'light' ? 'text-gray-900' : 'text-white';
  const heightClass = height === 'full' ? 'min-h-screen' : 'min-h-[60vh]';

  return (
    <section
      className={`relative flex items-center justify-center ${heightClass} overflow-hidden`}
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: '#111' }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            theme === 'gradient'
              ? `linear-gradient(135deg, rgba(0,0,0,${overlayOpacity + 0.2}), rgba(20,20,40,${overlayOpacity}))`
              : `rgba(0,0,0,${overlayOpacity})`,
        }}
      />

      {/* Content */}
      <div className={`relative z-10 text-center px-6 max-w-4xl mx-auto ${textColor}`}>
        {title && (
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-none">
            {title}
          </h1>
        )}
        {subtitle && (
          <div
            className="text-xl md:text-2xl mb-10 opacity-90 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: subtitle }}
          />
        )}
        {ctaLabel && ctaLink && (
          <a
            href={ctaLink}
            className="inline-block px-10 py-4 text-sm font-bold uppercase tracking-widest border-2 border-current transition-all duration-300 hover:bg-white hover:text-black"
          >
            {ctaLabel}
          </a>
        )}
      </div>
    </section>
  );
}
