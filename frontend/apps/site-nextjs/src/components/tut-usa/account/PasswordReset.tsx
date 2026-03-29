export interface PasswordResetData {
  title: string;
  submitAction: string;
  successMessage: string;
  tokenExpiryMinutes: number;
}

export function PasswordReset({ data }: { data: PasswordResetData }) {
  return (
    <div className="bg-surface-container p-10 max-w-md w-full">
      <h2 className="font-headline italic text-3xl text-on-surface mb-4">{data.title}</h2>
      {data.tokenExpiryMinutes > 0 && (
        <p className="font-body text-xs text-secondary mb-8">
          Reset link expires in {data.tokenExpiryMinutes} minutes.
        </p>
      )}
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-2">
            Email Address
          </label>
          <input
            type="email"
            className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface placeholder:text-secondary font-body text-sm focus:outline-none focus:border-primary transition-all"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-primary text-on-primary py-4 font-label uppercase text-xs tracking-widest font-bold hover:bg-primary-fixed transition-all"
        >
          Send Reset Link
        </button>
      </form>
      {data.successMessage && (
        <p className="font-body text-xs text-secondary mt-6 text-center">{data.successMessage}</p>
      )}
    </div>
  );
}
