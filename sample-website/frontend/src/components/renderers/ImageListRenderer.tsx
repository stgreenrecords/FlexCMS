import Image from 'next/image';
import Link from 'next/link';
import type { WkndComponent } from '@/lib/flexcms';

interface Props {
  component: WkndComponent;
}

interface ListItem {
  title?: string;
  description?: string;
  image?: string;
  link?: string;
  activity?: string;
  tripLength?: string;
  difficulty?: string;
  price?: string;
}

export function ImageListRenderer({ component }: Props) {
  const items = (component.data?.items as ListItem[]) ?? [];
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 my-6">
      {items.map((item, i) => (
        <div key={i} className="group relative overflow-hidden bg-wknd-black text-white">
          {item.image && (
            <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
              <Image
                src={item.image}
                alt={item.title ?? ''}
                fill
                className="object-cover opacity-75 group-hover:opacity-90 transition-opacity duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            </div>
          )}
          <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/80 to-transparent">
            {item.activity && (
              <span className="text-xs uppercase tracking-widest text-wknd-yellow mb-1">
                {item.activity}
              </span>
            )}
            {item.title && <h3 className="font-bold text-lg leading-tight mb-1">{item.title}</h3>}
            <div className="flex flex-wrap gap-2 text-xs text-gray-300 mb-2">
              {item.tripLength && <span>{item.tripLength}</span>}
              {item.difficulty && <span>· {item.difficulty}</span>}
              {item.price && <span>· From {item.price}</span>}
            </div>
            {item.link && (
              <Link
                href={item.link}
                className="text-xs font-semibold text-wknd-yellow hover:text-yellow-300 transition-colors"
              >
                Explore →
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
