export interface ProviderProfileData {
  name: string;
  specialty: string;
  /** Long text */
  bio: string;
  /** Photo — 400×400 */
  photo: string;
  /** list<reference> */
  locations: string[];
}

interface Props {
  data: ProviderProfileData;
}

export function ProviderProfile({ data }: Props) {
  const { name, specialty, bio, photo, locations } = data;

  return (
    <article className="bg-surface-container rounded-xl border border-outline-variant/20 p-5 flex flex-col sm:flex-row gap-5">
      {photo && (
        <div className="flex-shrink-0">
          <img
            src={photo}
            alt={name}
            width={400}
            height={400}
            className="w-24 h-24 rounded-full object-cover border-2 border-outline-variant/20"
          />
        </div>
      )}
      <div className="flex flex-col gap-3 flex-1">
        {name && (
          <h3 className="font-headline italic text-on-surface text-lg leading-snug">{name}</h3>
        )}
        {specialty && (
          <p className="text-sm text-primary font-label font-semibold">{specialty}</p>
        )}
        {bio && (
          <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">{bio}</p>
        )}
        {locations && locations.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-on-surface-variant font-label uppercase tracking-widest">Locations</span>
            <ul className="flex flex-wrap gap-2">
              {locations.map((location, index) => (
                <li
                  key={index}
                  className="px-3 py-1 rounded-full border border-outline-variant/40 bg-surface-container-low text-xs text-on-surface-variant font-label"
                >
                  {location}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}
