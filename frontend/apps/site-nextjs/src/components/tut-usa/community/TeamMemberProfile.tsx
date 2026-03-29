export interface SocialLink {
  label: string;
  url: string;
}

export interface TeamMemberProfileData {
  fullName: string;
  jobTitle: string;
  bio: string;
  /** Photo — 400×400 */
  photo: string;
  socialLinks: SocialLink[];
}

interface Props {
  data: TeamMemberProfileData;
}

export function TeamMemberProfile({ data }: Props) {
  const { fullName, jobTitle, bio, photo, socialLinks } = data;

  return (
    <div className="bg-surface-container rounded-xl border border-outline-variant/40 p-6 flex flex-col items-center text-center gap-4">
      {photo && (
        <img
          src={photo}
          alt={fullName}
          width={400}
          height={400}
          className="w-28 h-28 rounded-full object-cover"
        />
      )}
      <div className="flex flex-col gap-1">
        <h3 className="font-headline italic text-on-surface text-xl leading-snug">{fullName}</h3>
        {jobTitle && (
          <span className="font-label uppercase text-xs tracking-widest text-secondary">{jobTitle}</span>
        )}
      </div>
      {bio && (
        <p className="font-body text-sm text-on-surface-variant leading-relaxed max-w-prose">{bio}</p>
      )}
      {socialLinks && socialLinks.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 pt-1">
          {socialLinks.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-label uppercase text-xs tracking-widest text-primary hover:underline"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
