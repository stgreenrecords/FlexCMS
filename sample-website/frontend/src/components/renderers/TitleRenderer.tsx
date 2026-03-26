import type { WkndComponent } from '@/lib/flexcms';

interface Props {
  component: WkndComponent;
}

const TAG_CLASSES: Record<string, string> = {
  h1: 'text-5xl font-bold mt-10 mb-6',
  h2: 'text-3xl font-bold mt-8 mb-4',
  h3: 'text-2xl font-semibold mt-6 mb-3',
  h4: 'text-xl font-semibold mt-4 mb-2',
};

export function TitleRenderer({ component }: Props) {
  const text = (component.data?.text as string) ?? (component.data?.title as string) ?? '';
  const tag = ((component.data?.type as string) ?? 'h2').toLowerCase();
  const className = TAG_CLASSES[tag] ?? TAG_CLASSES.h2;

  if (tag === 'h1') return <h1 className={className}>{text}</h1>;
  if (tag === 'h3') return <h3 className={className}>{text}</h3>;
  if (tag === 'h4') return <h4 className={className}>{text}</h4>;
  return <h2 className={className}>{text}</h2>;
}
