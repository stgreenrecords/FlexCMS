import React from 'react';
import Image from 'next/image';

export interface IconListItem {
  icon: string;
  label: string;
  description?: string;
}

export interface IconListData {
  title?: string;
  items: IconListItem[];
  iconPosition: 'left' | 'top';
}

interface IconListProps {
  data: IconListData;
}

export function IconList({ data }: IconListProps) {
  const { title, items, iconPosition } = data;

  return (
    <div className="flex flex-col gap-6">
      {title && (
        <h2
          className="font-headline text-2xl italic"
          style={{ color: 'var(--color-on-surface, #dfe4ff)' }}
        >
          {title}
        </h2>
      )}
      <ul className={`flex flex-col gap-6`}>
        {items.map((item, index) => (
          <li
            key={index}
            className={`flex gap-4 ${iconPosition === 'top' ? 'flex-col items-start' : 'flex-row items-start'}`}
          >
            {item.icon && (
              <div className="flex-shrink-0">
                <Image
                  src={item.icon}
                  alt=""
                  width={32}
                  height={32}
                  className="object-contain"
                  aria-hidden="true"
                />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <span
                className="font-label text-xs tracking-widest uppercase"
                style={{ color: 'var(--color-on-surface, #dfe4ff)' }}
              >
                {item.label}
              </span>
              {item.description && (
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--color-primary, #c6c6c7)' }}
                >
                  {item.description}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
