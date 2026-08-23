export interface TutLink {
  label: string;
  url: string;
  openInNewTab: boolean;
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function isSafeUrl(value: string): boolean {
  if (!value || value === '#' || /^(javascript|vbscript|data):/i.test(value)) return false;
  return /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(value);
}

export function toTutLink(value: unknown, fallbackLabel = 'Learn more'): TutLink | null {
  const entry = record(value);
  const url = text(entry?.url ?? (typeof value === 'string' ? value : ''));
  if (!isSafeUrl(url)) return null;

  return {
    label: text(entry?.label ?? entry?.text ?? entry?.title ?? (typeof value === 'string' ? value : ''), fallbackLabel),
    url,
    openInNewTab: entry?.openInNewTab === true,
  };
}

export function linkAttributes(link: TutLink): { target?: '_blank'; rel?: 'noopener noreferrer' } {
  return link.openInNewTab
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};
}

