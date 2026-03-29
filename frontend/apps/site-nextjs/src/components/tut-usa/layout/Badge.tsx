import React from 'react';
import Image from 'next/image';

export interface BadgeData {
  text: string;
  styleVariant: 'default' | 'success' | 'warning' | 'error' | 'info';
  /** Badge icon — 24×24 */
  icon?: string;
}

interface BadgeProps {
  data: BadgeData;
}

const variantStyles: Record<BadgeData['styleVariant'], { bg: string; color: string; border: string }> = {
  default: {
    bg: 'var(--color-surface-container-low, #0a1228)',
    color: 'var(--color-primary, #c6c6c7)',
    border: 'var(--color-outline-variant, #32457c)',
  },
  success: {
    bg: 'rgba(34, 197, 94, 0.1)',
    color: '#4ade80',
    border: 'rgba(34, 197, 94, 0.3)',
  },
  warning: {
    bg: 'rgba(234, 179, 8, 0.1)',
    color: '#facc15',
    border: 'rgba(234, 179, 8, 0.3)',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    border: 'rgba(239, 68, 68, 0.3)',
  },
  info: {
    bg: 'rgba(59, 130, 246, 0.1)',
    color: '#60a5fa',
    border: 'rgba(59, 130, 246, 0.3)',
  },
};

export function Badge({ data }: BadgeProps) {
  const { text, styleVariant, icon } = data;
  const styles = variantStyles[styleVariant] ?? variantStyles.default;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 font-label text-xs tracking-widest uppercase border"
      style={{
        backgroundColor: styles.bg,
        color: styles.color,
        borderColor: styles.border,
      }}
    >
      {icon && (
        <Image
          src={icon}
          alt=""
          width={24}
          height={24}
          className="inline-block"
          aria-hidden="true"
        />
      )}
      {text}
    </span>
  );
}
