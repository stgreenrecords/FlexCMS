export interface EmailSignupData {
  headline: string;
  placeholder: string;
  submitLabel: string;
  successMessage: string;
  optInRequired: boolean;
}

export function EmailSignup({ data }: { data: EmailSignupData }) {
  return (
    <section className="px-12 py-16 bg-surface-container-low">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-headline italic text-3xl mb-8 text-on-surface">{data.headline}</h2>
        <form className="flex flex-col sm:flex-row gap-4" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            placeholder={data.placeholder || 'Enter your email'}
            className="flex-1 bg-transparent border border-outline-variant py-4 px-6 text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary transition-all"
          />
          <button
            type="submit"
            className="bg-primary text-on-primary px-8 py-4 font-label font-bold uppercase tracking-widest hover:bg-primary-fixed transition-all shrink-0"
          >
            {data.submitLabel || 'Subscribe'}
          </button>
        </form>
        {data.optInRequired && (
          <p className="mt-4 font-label text-xs text-secondary uppercase tracking-widest">
            By subscribing you agree to receive marketing communications.
          </p>
        )}
      </div>
    </section>
  );
}
