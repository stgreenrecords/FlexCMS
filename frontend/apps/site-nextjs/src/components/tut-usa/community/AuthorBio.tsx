export interface AuthorBioData {
  name: string;
  bio: string;
  /** Photo — 80×80 */
  photo: string;
  profileUrl: string;
}

interface Props {
  data: AuthorBioData;
}

export function AuthorBio({ data }: Props) {
  const { name, bio, photo, profileUrl } = data;

  return (
    <div className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-4 flex items-start gap-4">
      {photo && (
        <a href={profileUrl || undefined}>
          <img
            src={photo}
            alt={name}
            width={80}
            height={80}
            className="w-14 h-14 rounded-full object-cover flex-shrink-0"
          />
        </a>
      )}
      <div className="flex flex-col gap-1 min-w-0">
        <span className="font-label uppercase text-xs tracking-widest text-secondary">Written by</span>
        {profileUrl ? (
          <a
            href={profileUrl}
            className="font-headline italic text-on-surface text-base hover:text-primary transition-colors"
          >
            {name}
          </a>
        ) : (
          <span className="font-headline italic text-on-surface text-base">{name}</span>
        )}
        {bio && (
          <p className="font-body text-sm text-on-surface-variant leading-relaxed mt-1">{bio}</p>
        )}
      </div>
    </div>
  );
}
