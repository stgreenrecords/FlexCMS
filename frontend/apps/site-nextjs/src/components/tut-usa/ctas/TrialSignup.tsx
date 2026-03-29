export interface TrialSignupData {
  title: string;
  description: string;
  formReference: string;
  trialLengthDays: number;
}

export function TrialSignup({ data }: { data: TrialSignupData }) {
  return (
    <section className="px-12 py-24 bg-surface-container text-center">
      {data.trialLengthDays && (
        <span className="font-label text-xs font-bold text-primary uppercase tracking-[0.3em] mb-4 block">
          {data.trialLengthDays}-Day Free Trial
        </span>
      )}
      <h2 className="font-headline italic text-4xl text-on-surface mb-6">{data.title}</h2>
      {data.description && (
        <p className="font-body text-secondary max-w-xl mx-auto mb-10">{data.description}</p>
      )}
      <form className="max-w-md mx-auto flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
        <input
          type="email"
          placeholder="Work Email"
          className="bg-transparent border border-outline-variant py-4 px-6 text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary transition-all"
        />
        <button
          type="submit"
          className="bg-primary text-on-primary py-4 font-label font-bold uppercase tracking-widest hover:bg-primary-fixed transition-all"
        >
          Start Free Trial
        </button>
      </form>
    </section>
  );
}
