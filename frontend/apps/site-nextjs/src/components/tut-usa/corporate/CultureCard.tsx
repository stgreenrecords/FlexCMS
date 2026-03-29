export interface CultureCardData {
  title: string;
  description: string;
  /** Icon — 64×64 */
  icon: string;
  link: string;
}

interface Props {
  data: CultureCardData;
}

export function CultureCard({ data }: Props) {
  const { title, description, icon, link } = data;

  return (
    <article className="bg-surface-container rounded-xl p-6 border border-outline-variant flex flex-col gap-3 hover:shadow-md transition-shadow">
      {icon && (
        <img
          src={icon}
          alt=""
          width={64}
          height={64}
          className="w-12 h-12 object-contain"
          aria-hidden="true"
        />
      )}
      <h3 className="font-headline text-lg text-[var(--color-on-surface)]">{title}</h3>
      <p className="text-sm text-[var(--color-on-surface-variant)] leading-relaxed flex-1">{description}</p>
      {link && (
        <a
          href={link}
          className="font-label text-sm text-[var(--color-primary)] hover:underline mt-auto"
        >
          Learn more
        </a>
      )}
    </article>
  );
}
