export interface FeedbackQuestion {
  label: string;
  type: 'rating' | 'text' | 'textarea';
}

export interface FeedbackFormData {
  title: string;
  questions: FeedbackQuestion[];
  anonymousAllowed: boolean;
  submitAction: string;
}

export function FeedbackForm({ data }: { data: FeedbackFormData }) {
  return (
    <div className="bg-surface-container-high p-12">
      <h3 className="font-headline text-2xl italic mb-8 text-on-surface">{data.title}</h3>
      <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
        {data.questions &&
          data.questions.map((q, i) => (
            <div key={i}>
              <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-3">
                {q.label}
              </label>
              {q.type === 'rating' ? (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-secondary cursor-pointer hover:text-primary transition-colors text-xl">
                      ★
                    </span>
                  ))}
                </div>
              ) : q.type === 'textarea' ? (
                <textarea
                  rows={4}
                  placeholder="Your response..."
                  className="w-full bg-transparent border-b border-outline-variant/40 py-3 resize-none text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary transition-all"
                />
              ) : (
                <input
                  type="text"
                  className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary transition-all"
                />
              )}
            </div>
          ))}
        <button
          type="submit"
          className="w-full bg-primary text-on-primary py-4 font-label uppercase text-xs tracking-widest hover:bg-primary-fixed transition-all"
        >
          Submit Feedback
        </button>
      </form>
    </div>
  );
}
