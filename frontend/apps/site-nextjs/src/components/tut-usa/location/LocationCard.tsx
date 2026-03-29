export interface LocationCardData {
  name: string;
  address: string;
  phone: string;
  /** Long text */
  hours: string;
  mapLink: string;
}

interface Props {
  data: LocationCardData;
}

export function LocationCard({ data }: Props) {
  const { name, address, phone, hours, mapLink } = data;

  return (
    <article className="bg-surface-container rounded-xl border border-outline-variant/20 p-5 flex flex-col gap-3">
      {name && (
        <h3 className="font-headline italic text-on-surface text-lg leading-snug">{name}</h3>
      )}
      {address && (
        <p className="text-sm text-on-surface-variant font-label leading-relaxed">{address}</p>
      )}
      {phone && (
        <a
          href={`tel:${phone}`}
          className="text-sm text-primary font-label hover:underline"
        >
          {phone}
        </a>
      )}
      {hours && (
        <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">{hours}</p>
      )}
      {mapLink && (
        <a
          href={mapLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-sm text-primary font-label hover:underline"
        >
          View on map
        </a>
      )}
    </article>
  );
}
