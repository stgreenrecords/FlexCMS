import Image from 'next/image';
import type { WkndComponent } from '@/lib/flexcms';

interface Props {
  component: WkndComponent;
}

export function ImageRenderer({ component }: Props) {
  const src = (component.data?.fileReference as string) ?? (component.data?.src as string) ?? '';
  const alt = (component.data?.alt as string) ?? (component.data?.title as string) ?? '';
  if (!src) return null;

  return (
    <figure className="my-6">
      <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 1200px"
        />
      </div>
      {alt && <figcaption className="text-center text-sm text-gray-500 mt-2">{alt}</figcaption>}
    </figure>
  );
}
