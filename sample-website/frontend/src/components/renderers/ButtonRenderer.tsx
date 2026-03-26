import Link from 'next/link';
import type { WkndComponent } from '@/lib/flexcms';

interface Props {
  component: WkndComponent;
}

export function ButtonRenderer({ component }: Props) {
  const text = (component.data?.text as string) ?? (component.data?.title as string) ?? '';
  const link = (component.data?.link as string) ?? (component.data?.linkURL as string) ?? '#';
  if (!text) return null;

  return (
    <div className="my-4">
      <Link
        href={link}
        className="inline-block bg-wknd-yellow text-wknd-black font-semibold px-6 py-3 hover:bg-yellow-400 transition-colors"
      >
        {text}
      </Link>
    </div>
  );
}
