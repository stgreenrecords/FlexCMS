export interface PollData {
  question: string;
  options: string[];
  showResults: boolean;
  endDate: string;
}

export function Poll({ data }: { data: PollData }) {
  const now = new Date();
  const expired = data.endDate && new Date(data.endDate) < now;

  return (
    <div className="bg-surface-container-low p-12">
      <h3 className="font-headline text-2xl italic mb-4 text-on-surface">{data.question}</h3>
      {expired && (
        <p className="font-label text-xs text-secondary uppercase tracking-widest mb-6">Poll closed</p>
      )}
      <div className="space-y-4">
        {data.options &&
          data.options.map((opt, i) => (
            <div key={i} className="relative h-12">
              {data.showResults ? (
                <>
                  <div className="absolute inset-0 bg-outline-variant/10" />
                  <div className="absolute inset-0 bg-primary/20 border-r border-primary" style={{ width: `${Math.floor(Math.random() * 70 + 10)}%` }} />
                  <div className="flex justify-between font-label text-xs uppercase tracking-widest relative z-10 px-4 h-full items-center">
                    <span className="text-on-surface">{opt}</span>
                  </div>
                </>
              ) : (
                <label className="flex items-center justify-between p-4 border border-outline-variant/20 cursor-pointer hover:bg-surface-variant transition-colors h-full">
                  <span className="font-label text-xs uppercase tracking-widest text-on-surface">
                    {opt}
                  </span>
                  <input type="radio" name="poll" className="w-4 h-4 text-primary" />
                </label>
              )}
            </div>
          ))}
      </div>
      {!expired && !data.showResults && (
        <button
          className="mt-6 w-full border border-outline-variant py-3 font-label text-xs uppercase tracking-widest text-on-surface hover:bg-surface-container transition-all"
          onClick={(e) => e.preventDefault()}
        >
          Vote
        </button>
      )}
    </div>
  );
}
