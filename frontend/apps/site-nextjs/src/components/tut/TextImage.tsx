/** tut/text-image — two-column layout with rich text on one side and an image on the other. */
export function TextImage({ data }: { data: Record<string, unknown> }) {
  const title = data.title as string | undefined;
  const text = data.text as string | undefined;
  const image = data.image as string | undefined;
  const imageAlt = (data.imageAlt as string | undefined) ?? '';
  const imagePosition = (data.imagePosition as string | undefined) ?? 'right';
  const theme = (data.theme as string | undefined) ?? 'light';

  const isDark = theme === 'dark';
  const isImageRight = imagePosition === 'right';

  const textBlock = (
    <div className="flex flex-col justify-center gap-6">
      {title && (
        <h2 className={`text-4xl font-extrabold tracking-tight leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h2>
      )}
      {text && (
        <div
          className={`prose max-w-none ${isDark ? 'prose-invert' : ''}`}
          dangerouslySetInnerHTML={{ __html: text }}
        />
      )}
    </div>
  );

  const imageBlock = image ? (
    <div className="relative overflow-hidden rounded-sm">
      <img src={image} alt={imageAlt} className="w-full h-full object-cover" loading="lazy" />
    </div>
  ) : null;

  return (
    <section className={`py-20 px-6 ${isDark ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'}`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {isImageRight ? (
          <>
            {textBlock}
            {imageBlock}
          </>
        ) : (
          <>
            {imageBlock}
            {textBlock}
          </>
        )}
      </div>
    </section>
  );
}
