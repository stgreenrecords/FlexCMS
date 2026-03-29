export interface MentorProfileData {
  name: string;
  role: string;
  bio: string;
  /** Photo — 400×400 */
  photo: string;
  expertise: string[];
}

interface Props {
  data: MentorProfileData;
}

export function MentorProfile({ data }: Props) {
  const { name, role, bio, photo, expertise } = data;

  return (
    <div className="bg-surface-container rounded-xl border border-outline-variant/40 p-6 flex flex-col gap-4">
      <div className="flex items-start gap-4">
        {photo && (
          <img
            src={photo}
            alt={name}
            width={400}
            height={400}
            className="w-20 h-20 rounded-full object-cover flex-shrink-0"
          />
        )}
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <h3 className="font-headline italic text-on-surface text-xl leading-tight">{name}</h3>
          {role && (
            <span className="font-label uppercase text-xs tracking-widest text-secondary">{role}</span>
          )}
        </div>
      </div>
      {expertise && expertise.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {expertise.map((tag, i) => (
            <span
              key={i}
              className="bg-surface-container-low border border-outline-variant/40 font-label uppercase text-xs tracking-widest text-secondary px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {bio && (
        <p className="font-body text-sm text-on-surface-variant leading-relaxed">{bio}</p>
      )}
    </div>
  );
}
