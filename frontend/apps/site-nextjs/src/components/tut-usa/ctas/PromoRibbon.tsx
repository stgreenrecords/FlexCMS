export interface PromoRibbonData {
  text: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  styleVariant: 'primary' | 'error' | 'secondary';
}

const variantStyles: Record<string, string> = {
  primary: 'bg-primary text-on-primary',
  error: 'bg-error-container text-on-error-container',
  secondary: 'bg-secondary-container text-on-secondary-container',
};

export function PromoRibbon({ data }: { data: PromoRibbonData }) {
  const style = variantStyles[data.styleVariant] ?? variantStyles.primary;
  return (
    <div className={`inline-flex items-center px-4 py-1 ${style}`}>
      <span className="font-label text-xs font-bold uppercase tracking-widest">{data.text}</span>
    </div>
  );
}
