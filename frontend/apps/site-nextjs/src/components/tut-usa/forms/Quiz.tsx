export interface QuizQuestion {
  label: string;
  options: string[];
  correctIndex?: number;
}

export interface QuizData {
  title: string;
  questions: QuizQuestion[];
  passScore: number;
  resultsMessage: string;
}

export function Quiz({ data }: { data: QuizData }) {
  return (
    <div className="bg-surface-container-low p-10">
      <span className="font-label uppercase text-xs tracking-[0.3em] text-primary mb-6 block">
        Curation Quiz
      </span>
      <h3 className="font-headline text-2xl mb-8 text-on-surface">{data.title}</h3>
      <form className="space-y-10" onSubmit={(e) => e.preventDefault()}>
        {data.questions &&
          data.questions.map((q, i) => (
            <div key={i}>
              <p className="font-body text-sm text-secondary mb-4">{q.label}</p>
              <div className="space-y-3">
                {q.options &&
                  q.options.map((opt, j) => (
                    <label
                      key={j}
                      className="group flex items-center justify-between p-4 border border-outline-variant/20 cursor-pointer hover:bg-surface-variant transition-colors"
                    >
                      <span className="font-label text-xs uppercase tracking-widest text-on-surface">
                        {opt}
                      </span>
                      <input type="radio" name={`quiz-q-${i}`} className="hidden" />
                    </label>
                  ))}
              </div>
            </div>
          ))}
        {data.resultsMessage && (
          <p className="font-body text-xs text-secondary">{data.resultsMessage}</p>
        )}
        <button
          type="submit"
          className="w-full bg-primary text-on-primary py-4 font-label uppercase text-xs tracking-widest font-bold hover:bg-primary-fixed transition-all"
        >
          Submit Quiz
        </button>
      </form>
    </div>
  );
}
