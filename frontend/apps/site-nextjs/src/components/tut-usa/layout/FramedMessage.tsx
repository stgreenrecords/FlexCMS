import React from 'react';
import Image from 'next/image';

export interface FramedMessageData {
  title: string;
  message: string;
  styleVariant: 'info' | 'warning' | 'error' | 'success';
  /** Framed message icon — 24×24 */
  icon?: string;
}

interface FramedMessageProps {
  data: FramedMessageData;
}

const variantStyles: Record<
  FramedMessageData['styleVariant'],
  { bg: string; border: string; titleColor: string; messageColor: string }
> = {
  info: {
    bg: 'rgba(59, 130, 246, 0.08)',
    border: 'rgba(59, 130, 246, 0.3)',
    titleColor: '#60a5fa',
    messageColor: 'var(--color-primary, #c6c6c7)',
  },
  warning: {
    bg: 'rgba(234, 179, 8, 0.08)',
    border: 'rgba(234, 179, 8, 0.3)',
    titleColor: '#facc15',
    messageColor: 'var(--color-primary, #c6c6c7)',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.3)',
    titleColor: '#f87171',
    messageColor: 'var(--color-primary, #c6c6c7)',
  },
  success: {
    bg: 'rgba(34, 197, 94, 0.08)',
    border: 'rgba(34, 197, 94, 0.3)',
    titleColor: '#4ade80',
    messageColor: 'var(--color-primary, #c6c6c7)',
  },
};

const roleMap: Record<FramedMessageData['styleVariant'], string> = {
  info: 'note',
  warning: 'note',
  error: 'alert',
  success: 'note',
};

export function FramedMessage({ data }: FramedMessageProps) {
  const { title, message, styleVariant, icon } = data;
  const styles = variantStyles[styleVariant] ?? variantStyles.info;

  return (
    <div
      role={roleMap[styleVariant]}
      className="flex gap-4 p-6 border"
      style={{
        backgroundColor: styles.bg,
        borderColor: styles.border,
      }}
    >
      {icon && (
        <div className="flex-shrink-0 mt-0.5">
          <Image
            src={icon}
            alt=""
            width={24}
            height={24}
            className="object-contain"
            aria-hidden="true"
          />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p
          className="font-label text-xs tracking-widest uppercase"
          style={{ color: styles.titleColor }}
        >
          {title}
        </p>
        <p
          className="text-sm leading-relaxed"
          style={{ color: styles.messageColor }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}
