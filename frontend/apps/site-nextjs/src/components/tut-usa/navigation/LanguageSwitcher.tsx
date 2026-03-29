interface Props { data: Record<string, unknown> }

export function LanguageSwitcher({ data }: Props) {
  const availableLocales = (data.availableLocales as string[]) ?? [];
  const currentLocale = (data.currentLocale as string) ?? 'en-US';
  const fallbackLocale = (data.fallbackLocale as string) ?? 'en-US';

  const displayLocales = availableLocales.length > 0 ? availableLocales : [fallbackLocale];

  return (
    <div className="flex items-center gap-2 flex-wrap" role="navigation" aria-label="Language switcher">
      {displayLocales.map((locale, i) => {
        const isCurrent = locale === currentLocale;
        return (
          <button
            key={i}
            type="button"
            className={`text-xs uppercase tracking-widest px-2 py-1 border transition-colors duration-200 cursor-pointer bg-transparent ${
              isCurrent
                ? 'border-white text-white'
                : 'border-neutral-700 text-neutral-400 hover:border-white hover:text-white'
            }`}
            aria-current={isCurrent ? 'true' : undefined}
            aria-label={`Switch to ${locale}`}
          >
            {locale}
          </button>
        );
      })}
    </div>
  );
}
