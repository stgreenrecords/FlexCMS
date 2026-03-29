export interface ReviewFormField {
  name: string;
  label: string;
  type: string;
}

export interface ReviewFormData {
  title: string;
  fields: ReviewFormField[];
  moderationRequired: boolean;
}

export function ReviewForm({ data }: { data: ReviewFormData }) {
  return (
    <div className="bg-surface-container p-8">
      <h3 className="font-headline italic text-2xl text-on-surface mb-6">{data.title}</h3>
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-2">Rating</label>
          <div className="flex gap-2">
            {[1,2,3,4,5].map(s => (
              <button key={s} type="button" className="text-2xl text-outline-variant/40 hover:text-primary transition-all">★</button>
            ))}
          </div>
        </div>
        {data.fields && data.fields.map((f, i) => (
          <div key={i}>
            <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-2">{f.label}</label>
            {f.type === 'textarea' ? (
              <textarea
                name={f.name}
                rows={4}
                className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface placeholder:text-secondary font-body text-sm focus:outline-none focus:border-primary transition-all resize-none"
              />
            ) : (
              <input
                type={f.type === 'email' ? 'email' : 'text'}
                name={f.name}
                className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface placeholder:text-secondary font-body text-sm focus:outline-none focus:border-primary transition-all"
              />
            )}
          </div>
        ))}
        {data.moderationRequired && (
          <p className="font-body text-xs text-secondary">Reviews are subject to moderation before publication.</p>
        )}
        <button type="submit" className="bg-primary text-on-primary px-8 py-3 font-label uppercase text-xs tracking-widest hover:bg-primary-fixed transition-all">
          Submit Review
        </button>
      </form>
    </div>
  );
}
