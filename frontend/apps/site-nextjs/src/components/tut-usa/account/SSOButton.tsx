export interface SSOButtonData {
  label: string;
  provider: string;
  loginUrl: string;
  /** Provider icon — 24×24 */
  icon: string;
}

export function SSOButton({ data }: { data: SSOButtonData }) {
  return (
    <a
      href={data.loginUrl}
      className="flex items-center justify-center gap-3 border border-outline-variant/40 py-3 px-6 font-label uppercase text-xs tracking-widest text-secondary hover:border-primary hover:text-on-surface transition-all"
    >
      {data.icon && <img src={data.icon} alt={data.provider} className="w-5 h-5 object-contain" />}
      {data.label || `Continue with ${data.provider}`}
    </a>
  );
}
