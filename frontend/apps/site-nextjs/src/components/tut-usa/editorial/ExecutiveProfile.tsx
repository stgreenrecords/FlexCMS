export interface ExecutiveProfileData {
  name: string;
  title: string;
  bio: string;
  /** Photo — 300×300 */
  photo: string;
  quotes: string[];
}

interface Props {
  data: ExecutiveProfileData;
}

export function ExecutiveProfile({ data }: Props) {
  const { name, title, bio, photo, quotes } = data;

  return (
    <article className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-8">
      <div className="flex flex-col sm:flex-row gap-8">
        {photo && (
          <div className="shrink-0">
            <img
              src={photo}
              alt={name}
              width={300}
              height={300}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-2 border-outline-variant/30"
            />
          </div>
        )}
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="font-headline italic text-on-surface text-2xl">{name}</h2>
            {title && (
              <p className="font-label tracking-widest uppercase text-xs text-primary mt-1">
                {title}
              </p>
            )}
          </div>
          {bio && (
            <p className="text-sm text-on-surface-variant leading-relaxed">{bio}</p>
          )}
        </div>
      </div>
      {quotes.length > 0 && (
        <div className="mt-6 flex flex-col gap-4">
          {quotes.map((quote, i) => (
            <blockquote
              key={i}
              className="border-l-4 border-primary pl-4 font-headline italic text-on-surface text-lg"
            >
              &ldquo;{quote}&rdquo;
            </blockquote>
          ))}
        </div>
      )}
    </article>
  );
}
