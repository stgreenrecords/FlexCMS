import Image from 'next/image';
import Link from 'next/link';
import type { WkndComponent } from '@/lib/flexcms';
import { dotPathToUrl } from '@/lib/flexcms';

interface Props {
  component: WkndComponent;
}

export function TeaserRenderer({ component }: Props) {
  const title = (component.data?.title as string) ?? '';
  const description = (component.data?.description as string) ?? '';
  const image = (component.data?.fileReference as string) ?? (component.data?.image as string) ?? '';
  const linkPath = (component.data?.linkURL as string) ?? (component.data?.link as string) ?? '';
  const ctaText = (component.data?.ctaText as string) ?? 'Explore';

  const href = linkPath
    ? linkPath.startsWith('/')
      ? linkPath
      : '/' + dotPathToUrl(linkPath).replace(/^\//, '')
    : '#';

  return (
    <div className="group relative overflow-hidden bg-wknd-black text-white">
      {image && (
        <div className="relative w-full" style={{ aspectRatio: '3/2' }}>
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover opacity-70 group-hover:opacity-80 transition-opacity duration-300"
            sizes="(max-width: 768px) 100vw, 600px"
          />
        </div>
      )}
      <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-black/70 to-transparent">
        {title && <h3 className="text-2xl font-bold mb-2">{title}</h3>}
        {description && <p className="text-sm text-gray-200 mb-4 line-clamp-2">{description}</p>}
        {linkPath && (
          <Link
            href={href}
            className="inline-block bg-wknd-yellow text-wknd-black font-semibold px-5 py-2 text-sm w-fit hover:bg-yellow-400 transition-colors"
          >
            {ctaText}
          </Link>
        )}
      </div>
    </div>
  );
}
