export interface OfficeLocationData {
  officeName: string;
  address: string;
  map: string;
  /** Photo — 800×500 */
  photo: string;
  amenities: string[];
}

interface Props {
  data: OfficeLocationData;
}

export function OfficeLocation({ data }: Props) {
  const { officeName, address, map, photo, amenities } = data;

  return (
    <section className="bg-surface-container rounded-xl overflow-hidden border border-outline-variant">
      {photo && (
        <img
          src={photo}
          alt={officeName}
          width={800}
          height={500}
          className="w-full object-cover max-h-64"
        />
      )}
      <div className="p-6">
        <h2 className="font-headline text-xl text-[var(--color-on-surface)] mb-1">{officeName}</h2>
        <p className="text-sm text-[var(--color-on-surface-variant)] mb-3">{address}</p>
        {amenities.length > 0 && (
          <ul className="flex flex-wrap gap-2 mb-4">
            {amenities.map((amenity, i) => (
              <li
                key={i}
                className="font-label text-xs bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] rounded-full px-3 py-1"
              >
                {amenity}
              </li>
            ))}
          </ul>
        )}
        {map && (
          <a
            href={map}
            target="_blank"
            rel="noopener noreferrer"
            className="font-label text-sm text-[var(--color-primary)] hover:underline"
          >
            View on map
          </a>
        )}
      </div>
    </section>
  );
}
