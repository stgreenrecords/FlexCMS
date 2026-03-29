interface Props { data: Record<string, unknown> }

export function TutUsaLogo({ data }: Props) {
  const brandName = (data.brandName as string) ?? 'TUT';
  const image = (data.image as string) ?? '';
  const altText = (data.altText as string) ?? brandName;
  const destinationUrl = (data.destinationUrl as string) ?? '/';
  const themeVariant = (data.themeVariant as string) ?? 'dark';

  const textClass =
    themeVariant === 'light'
      ? 'text-black'
      : 'text-white';

  return (
    <a
      href={destinationUrl}
      className={`inline-flex items-center ${textClass} no-underline`}
      aria-label={brandName}
    >
      {image ? (
        <img
          src={image}
          alt={altText}
          className="h-8 w-auto object-contain"
        />
      ) : (
        <span className="text-xl font-extralight tracking-[0.3em] uppercase">
          {brandName}
        </span>
      )}
    </a>
  );
}
