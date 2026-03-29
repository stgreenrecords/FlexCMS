export interface PickupLocationCardData {
  name: string;
  address: string;
  /** Long text */
  hours: string;
  mapUrl: string;
}

interface Props {
  data: PickupLocationCardData;
}

export function PickupLocationCard({ data }: Props) {
  const { name, address, hours, mapUrl } = data;

  return (
    <article className="bg-surface-container rounded-xl border border-outline-variant/20 p-5 flex flex-col gap-3">
      {name && (
        <h3 className="font-headline italic text-on-surface text-lg leading-snug">{name}</h3>
      )}
      {address && (
        <p className="text-sm text-on-surface-variant font-label leading-relaxed">{address}</p>
      )}
      {hours && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-on-surface-variant font-label uppercase tracking-widest">Hours</span>
          <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line">{hours}</p>
        </div>
      )}
      {mapUrl && (
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-sm text-primary font-label hover:underline"
        >
          Get directions
        </a>
      )}
    </article>
  );
}
