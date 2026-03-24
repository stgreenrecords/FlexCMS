import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility to merge Tailwind CSS classes without conflicts.
 * Used by all @flexcms/ui components internally.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

