export interface FacultyProfileData {
  name: string;
  title: string;
  bio: string;
  /** Photo — 400×400 */
  photo: string;
  specialties: string[];
}

interface Props {
  data: FacultyProfileData;
}

export function FacultyProfile({ data }: Props) {
  const { name, title, bio, photo, specialties } = data;

  return (
    <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 flex flex-col gap-6 sm:flex-row sm:items-start">
      <div className="shrink-0">
        <img
          src={photo}
          alt={`Photo of ${name}`}
          width={120}
          height={120}
          className="rounded-full object-cover w-28 h-28 border-2 border-outline-variant"
        />
      </div>

      <div className="flex flex-col gap-4 flex-1">
        <div className="flex flex-col gap-0.5">
          <h3 className="font-headline text-xl text-on-surface">{name}</h3>
          <p className="text-sm font-label text-primary">{title}</p>
        </div>

        <p className="text-sm text-secondary leading-relaxed">{bio}</p>

        {specialties.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-label font-semibold text-secondary uppercase tracking-wider">
              Specialties
            </p>
            <ul className="flex flex-wrap gap-2">
              {specialties.map((specialty) => (
                <li
                  key={specialty}
                  className="text-xs px-3 py-1 rounded-full border border-outline-variant bg-surface-container text-secondary font-label"
                >
                  {specialty}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
