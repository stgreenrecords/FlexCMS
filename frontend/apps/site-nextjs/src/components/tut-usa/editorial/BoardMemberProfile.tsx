export interface BoardMemberProfileData {
  name: string;
  role: string;
  bio: string;
  /** Photo — 300×300 */
  photo: string;
  committeeMemberships: string[];
}

interface Props {
  data: BoardMemberProfileData;
}

export function BoardMemberProfile({ data }: Props) {
  const { name, role, bio, photo, committeeMemberships } = data;

  return (
    <article className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-start gap-4">
        {photo && (
          <img
            src={photo}
            alt={name}
            width={300}
            height={300}
            className="w-16 h-16 rounded-full object-cover border border-outline-variant/20 shrink-0"
          />
        )}
        <div>
          <h3 className="font-headline italic text-on-surface text-lg">{name}</h3>
          {role && (
            <p className="font-label tracking-widest uppercase text-xs text-primary mt-1">
              {role}
            </p>
          )}
        </div>
      </div>
      {bio && (
        <p className="text-sm text-on-surface-variant leading-relaxed">{bio}</p>
      )}
      {committeeMemberships.length > 0 && (
        <div>
          <h4 className="font-label tracking-widest uppercase text-xs text-on-surface-variant mb-2">
            Committees
          </h4>
          <ul className="flex flex-wrap gap-2">
            {committeeMemberships.map((c, i) => (
              <li
                key={i}
                className="text-xs text-on-surface-variant border border-outline-variant/20 rounded px-2 py-0.5"
              >
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
