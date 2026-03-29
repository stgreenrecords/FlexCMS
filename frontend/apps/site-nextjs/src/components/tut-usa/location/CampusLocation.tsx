export interface CampusLocationData {
  name: string;
  address: string;
  mapLink: string;
  programs: string[];
  /** Photo — 800×500 */
  photo: string;
}

interface Props {
  data: CampusLocationData;
}

export function CampusLocation({ data }: Props) {
  const { name, address, mapLink, programs, photo } = data;

  return (
    <article className="bg-surface-container rounded-xl border border-outline-variant/20 overflow-hidden flex flex-col">
      {photo && (
        <div className="relative overflow-hidden" style={{ aspectRatio: '8/5' }}>
          <img
            src={photo}
            alt={name}
            width={800}
            height={500}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-5 flex flex-col gap-3">
        {name && (
          <h3 className="font-headline italic text-on-surface text-lg leading-snug">{name}</h3>
        )}
        {address && (
          <p className="text-sm text-on-surface-variant font-label leading-relaxed">{address}</p>
        )}
        {programs && programs.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Programs offered">
            {programs.map((program, index) => (
              <li
                key={index}
                className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-label"
              >
                {program}
              </li>
            ))}
          </ul>
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
      </div>
    </article>
  );
}
