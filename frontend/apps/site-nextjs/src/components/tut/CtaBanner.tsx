/** tut/cta-banner — call-to-action banner with configurable theme. */
export function CtaBanner({ data }: { data: Record<string, unknown> }) {
  const title = data.title as string | undefined;
  const text = data.text as string | undefined;
  const ctaLabel = data.ctaLabel as string | undefined;
  const ctaLink = data.ctaLink as string | undefined;
  const theme = (data.theme as string | undefined) ?? 'primary';

  const themeStyles: Record<string, { section: string; heading: string; body: string; button: string }> = {
    primary: {
      section: 'bg-gray-900 text-white',
      heading: 'text-white',
      body: 'text-gray-300',
      button: 'border-white text-white hover:bg-white hover:text-gray-900',
    },
    dark: {
      section: 'bg-black text-white',
      heading: 'text-white',
      body: 'text-gray-400',
      button: 'border-white text-white hover:bg-white hover:text-black',
    },
    accent: {
      section: 'bg-white text-gray-900',
      heading: 'text-gray-900',
      body: 'text-gray-600',
      button: 'border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white',
    },
  };

  const styles = themeStyles[theme] ?? themeStyles.primary;

  return (
    <section className={`py-24 px-6 text-center ${styles.section}`}>
      <div className="max-w-3xl mx-auto">
        {title && (
          <h2 className={`text-4xl md:text-5xl font-extrabold tracking-tight mb-6 ${styles.heading}`}>
            {title}
          </h2>
        )}
        {text && (
          <p className={`text-lg mb-10 leading-relaxed ${styles.body}`}>{text}</p>
        )}
        {ctaLabel && ctaLink && (
          <a
            href={ctaLink}
            className={`inline-block px-12 py-4 text-sm font-bold uppercase tracking-widest border-2 transition-all duration-300 ${styles.button}`}
          >
            {ctaLabel}
          </a>
        )}
      </div>
    </section>
  );
}
