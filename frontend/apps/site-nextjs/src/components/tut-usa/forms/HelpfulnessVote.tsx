export interface HelpfulnessVoteData {
  question: string;
  yesLabel: string;
  noLabel: string;
  submitAction: string;
}

export function HelpfulnessVote({ data }: { data: HelpfulnessVoteData }) {
  return (
    <div className="flex items-center gap-6 py-4 border-t border-outline-variant/20">
      <p className="font-body text-sm text-secondary">{data.question}</p>
      <div className="flex gap-3 shrink-0">
        <button
          className="border border-outline-variant/40 px-4 py-2 font-label text-xs uppercase tracking-widest text-on-surface hover:border-primary hover:text-primary transition-all"
          onClick={(e) => e.preventDefault()}
        >
          {data.yesLabel || 'Yes'}
        </button>
        <button
          className="border border-outline-variant/40 px-4 py-2 font-label text-xs uppercase tracking-widest text-secondary hover:border-error hover:text-error transition-all"
          onClick={(e) => e.preventDefault()}
        >
          {data.noLabel || 'No'}
        </button>
      </div>
    </div>
  );
}
