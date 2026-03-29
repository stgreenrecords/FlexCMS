export interface VoteCardData {
  title: string;
  description: string;
  voteCount: number;
  submitAction: string;
}

interface Props {
  data: VoteCardData;
}

export function VoteCard({ data }: Props) {
  const { title, description, voteCount, submitAction } = data;

  return (
    <div className="bg-surface-container rounded-xl border border-outline-variant/40 p-6 flex flex-col gap-4">
      {title && (
        <h3 className="font-headline italic text-on-surface text-xl leading-snug">{title}</h3>
      )}
      {description && (
        <p className="font-body text-sm text-on-surface-variant leading-relaxed">{description}</p>
      )}
      <div className="flex items-center justify-between pt-2 border-t border-outline-variant/40">
        <div className="flex items-baseline gap-2">
          <span className="font-headline italic text-on-surface text-3xl">
            {(voteCount ?? 0).toLocaleString()}
          </span>
          <span className="font-label uppercase text-xs tracking-widest text-secondary">votes</span>
        </div>
        <button
          type="button"
          data-action={submitAction}
          className="bg-primary text-on-primary font-label uppercase text-xs tracking-widest px-5 py-2.5 rounded hover:bg-primary-fixed transition-colors"
        >
          Vote
        </button>
      </div>
    </div>
  );
}
