export interface RoadmapSectionData {
  title: string;
  items: { label: string; status: string; quarter?: string; description?: string }[];
  disclaimer: string;
}

interface Props {
  data: RoadmapSectionData;
}

const statusStyles: Record<string, string> = {
  done: 'bg-[var(--color-success-container,#d4edda)] text-[var(--color-on-success-container,#155724)]',
  'in-progress': 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]',
  planned: 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]',
};

function statusClass(status: string): string {
  const key = status.toLowerCase().replace(/\s+/g, '-');
  return statusStyles[key] ?? statusStyles['planned'];
}

export function RoadmapSection({ data }: Props) {
  const { title, items, disclaimer } = data;

  return (
    <section className="py-4">
      <h2 className="font-headline text-2xl text-[var(--color-on-surface)] mb-6">{title}</h2>
      <ol className="flex flex-col gap-4 mb-6">
        {items.map((item, i) => (
          <li
            key={i}
            className="bg-surface-container rounded-xl p-5 border border-outline-variant flex flex-col sm:flex-row sm:items-start gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-headline text-base text-[var(--color-on-surface)]">{item.label}</span>
                {item.quarter && (
                  <span className="font-label text-xs text-[var(--color-on-surface-variant)]">{item.quarter}</span>
                )}
              </div>
              {item.description && (
                <p className="text-sm text-[var(--color-on-surface-variant)] leading-relaxed">{item.description}</p>
              )}
            </div>
            <span className={`font-label text-xs rounded-full px-3 py-1 shrink-0 capitalize ${statusClass(item.status)}`}>
              {item.status}
            </span>
          </li>
        ))}
      </ol>
      {disclaimer && (
        <p className="text-xs text-[var(--color-on-surface-variant)] italic">{disclaimer}</p>
      )}
    </section>
  );
}
