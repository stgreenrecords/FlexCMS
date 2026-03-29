export interface RecallNoticeData {
  title: string;
  message: string;
  affectedProducts: string[];
  actionUrl: string;
}

interface Props {
  data: RecallNoticeData;
}

export function RecallNotice({ data }: Props) {
  const { title, message, affectedProducts, actionUrl } = data;

  return (
    <section
      role="alert"
      className="bg-[var(--color-error-container)] text-[var(--color-on-error-container)] rounded-xl p-6 border border-[var(--color-error)]"
    >
      <h2 className="font-headline text-xl mb-2">{title}</h2>
      <p className="text-sm leading-relaxed mb-4">{message}</p>
      {affectedProducts.length > 0 && (
        <div className="mb-4">
          <p className="font-label text-sm mb-2">Affected products:</p>
          <ul className="flex flex-col gap-1">
            {affectedProducts.map((product, i) => (
              <li key={i} className="text-sm flex items-center gap-2 before:content-['•'] before:text-[var(--color-error)]">
                {product}
              </li>
            ))}
          </ul>
        </div>
      )}
      <a
        href={actionUrl}
        className="font-label text-sm bg-[var(--color-error)] text-[var(--color-on-error)] rounded px-5 py-2 inline-block hover:opacity-90 transition-opacity"
      >
        Take Action
      </a>
    </section>
  );
}
