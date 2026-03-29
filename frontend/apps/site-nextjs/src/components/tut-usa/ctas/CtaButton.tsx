export interface CtaButtonData {
  label: string;
  url: string;
  styleVariant: 'primary' | 'secondary' | 'ghost';
  openInNewTab: boolean;
}

const variantStyles: Record<string, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-fixed',
  secondary: 'bg-surface-container text-on-surface hover:bg-surface-container-high',
  ghost: 'border border-outline-variant text-on-surface hover:bg-surface-variant',
};

export function CtaButton({ data }: { data: CtaButtonData }) {
  const style = variantStyles[data.styleVariant] ?? variantStyles.primary;
  return (
    <a
      href={data.url}
      target={data.openInNewTab ? '_blank' : undefined}
      rel={data.openInNewTab ? 'noopener noreferrer' : undefined}
      className={`inline-block px-10 py-4 font-label font-bold uppercase tracking-widest transition-all ${style}`}
    >
      {data.label}
    </a>
  );
}
