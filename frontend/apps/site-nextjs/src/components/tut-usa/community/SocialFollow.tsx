export interface SocialProfile {
  label: string;
  url: string;
}

export interface SocialFollowData {
  title: string;
  profiles: SocialProfile[];
  iconStyle: string;
}

interface Props {
  data: SocialFollowData;
}

export function SocialFollow({ data }: Props) {
  const { title, profiles } = data;

  return (
    <div className="flex flex-col gap-3">
      {title && (
        <span className="font-label uppercase text-xs tracking-widest text-secondary">{title}</span>
      )}
      {profiles && profiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {profiles.map((profile) => (
            <a
              key={profile.url}
              href={profile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-surface-container border border-outline-variant/40 font-label uppercase text-xs tracking-widest text-on-surface px-3 py-2 rounded hover:bg-primary-fixed hover:text-on-surface transition-colors"
            >
              {profile.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
