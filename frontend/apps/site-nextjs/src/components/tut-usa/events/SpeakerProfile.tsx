export interface SpeakerProfileData {
  name: string;
  title: string;
  organization: string;
  bio: string;
  /** Speaker photo — 400×400 */
  photo: string;
}

export function SpeakerProfile({ data }: { data: SpeakerProfileData }) {
  return (
    <div className="bg-surface-container p-8 flex gap-6">
      {data.photo && (
        <img
          src={data.photo}
          alt={data.name}
          className="w-24 h-24 object-cover flex-shrink-0"
        />
      )}
      <div>
        <h3 className="font-headline italic text-2xl text-on-surface mb-1">{data.name}</h3>
        {data.title && (
          <span className="font-label uppercase text-xs tracking-widest text-primary block mb-1">{data.title}</span>
        )}
        {data.organization && (
          <span className="font-label uppercase text-xs tracking-widest text-secondary block mb-4">{data.organization}</span>
        )}
        {data.bio && <p className="font-body text-sm text-secondary leading-relaxed">{data.bio}</p>}
      </div>
    </div>
  );
}
