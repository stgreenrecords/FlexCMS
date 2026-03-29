import React from 'react';
import Image from 'next/image';

export interface MediaObjectData {
  title: string;
  description: string;
  /** Media object image — 800×600 */
  media: string;
  mediaPosition: 'left' | 'right';
}

interface MediaObjectProps {
  data: MediaObjectData;
}

export function MediaObject({ data }: MediaObjectProps) {
  const { title, description, media, mediaPosition } = data;

  return (
    <div
      className={`flex flex-col md:flex-row gap-8 items-start mb-8 ${mediaPosition === 'right' ? 'md:flex-row-reverse' : ''}`}
    >
      {media && (
        <div className="relative flex-shrink-0 w-full md:w-auto" style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ aspectRatio: '4/3', position: 'relative' }}>
            <Image
              src={media}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover"
            />
          </div>
        </div>
      )}
      <div className="flex flex-col gap-4 flex-1">
        <h3
          className="font-headline text-2xl italic"
          style={{ color: 'var(--color-on-surface, #dfe4ff)' }}
        >
          {title}
        </h3>
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--color-primary, #c6c6c7)' }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}
