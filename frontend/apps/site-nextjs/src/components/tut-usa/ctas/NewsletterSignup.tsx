export interface NewsletterSignupData {
  title: string;
  description: string;
  formReference: string;
  successMessage: string;
  consentText: string;
}

export function NewsletterSignup({ data }: { data: NewsletterSignupData }) {
  return (
    <section className="px-12 py-24 bg-surface-container">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
        <div>
          <h2 className="font-headline italic text-4xl mb-4 text-on-surface">{data.title}</h2>
          {data.description && (
            <p className="font-body text-secondary">{data.description}</p>
          )}
        </div>
        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
          <div className="relative">
            <input
              type="email"
              placeholder="Email Address"
              className="w-full bg-transparent border-0 border-b border-outline-variant py-4 px-0 focus:ring-0 focus:border-primary transition-all text-on-surface placeholder:text-secondary placeholder:uppercase placeholder:text-xs placeholder:tracking-widest"
            />
          </div>
          {data.consentText && (
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                id="nl-consent"
                className="w-4 h-4 bg-transparent border-outline-variant text-primary focus:ring-0"
              />
              <label htmlFor="nl-consent" className="font-label text-xs uppercase tracking-widest text-secondary">
                {data.consentText}
              </label>
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-primary text-on-primary py-4 font-label font-bold uppercase tracking-widest hover:bg-primary-fixed transition-all"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
