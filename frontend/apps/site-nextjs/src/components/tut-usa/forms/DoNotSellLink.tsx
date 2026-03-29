export interface DoNotSellLinkData {
  label: string;
  requestUrl: string;
  regions: string[];
}

export function DoNotSellLink({ data }: { data: DoNotSellLinkData }) {
  return (
    <div>
      <a
        href={data.requestUrl}
        className="font-label text-xs uppercase tracking-widest text-secondary hover:text-primary border-b border-transparent hover:border-primary transition-all"
      >
        {data.label || 'Do Not Sell My Personal Information'}
      </a>
      {data.regions && data.regions.length > 0 && (
        <p className="font-label text-xs text-secondary mt-1 opacity-60">
          {data.regions.join(' · ')}
        </p>
      )}
    </div>
  );
}
