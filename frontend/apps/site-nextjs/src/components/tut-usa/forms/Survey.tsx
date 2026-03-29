export interface SurveyQuestion {
  label: string;
  type: 'text' | 'radio' | 'checkbox' | 'rating';
  options?: string[];
}

export interface SurveyData {
  title: string;
  questions: SurveyQuestion[];
  progressBar: boolean;
  thankYouMessage: string;
}

export function Survey({ data }: { data: SurveyData }) {
  return (
    <div className="bg-surface-container p-10 max-w-2xl mx-auto">
      <h2 className="font-headline text-3xl italic mb-4 text-on-surface">{data.title}</h2>
      {data.progressBar && (
        <div className="w-full bg-outline-variant/20 h-1 mb-8">
          <div className="bg-primary h-1 w-1/3" />
        </div>
      )}
      <form className="space-y-10" onSubmit={(e) => e.preventDefault()}>
        {data.questions &&
          data.questions.map((q, i) => (
            <div key={i}>
              <p className="font-label uppercase text-xs tracking-widest text-secondary mb-4">
                {q.label}
              </p>
              {q.type === 'radio' && q.options ? (
                <div className="space-y-3">
                  {q.options.map((opt, j) => (
                    <label
                      key={j}
                      className="flex items-center justify-between p-4 border border-outline-variant/20 cursor-pointer hover:bg-surface-variant transition-colors"
                    >
                      <span className="font-label text-xs uppercase tracking-widest text-on-surface">
                        {opt}
                      </span>
                      <input type="radio" name={`q-${i}`} className="hidden" />
                    </label>
                  ))}
                </div>
              ) : q.type === 'rating' ? (
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className="text-secondary cursor-pointer hover:text-primary text-xl transition-colors">
                      ★
                    </span>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface focus:outline-none focus:border-primary transition-all"
                />
              )}
            </div>
          ))}
        <button
          type="submit"
          className="w-full bg-primary text-on-primary py-4 font-label uppercase text-xs tracking-widest font-bold hover:bg-primary-fixed transition-all"
        >
          Submit Survey
        </button>
      </form>
    </div>
  );
}
