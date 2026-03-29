export interface LoginFormData {
  title: string;
  usernameLabel: string;
  passwordLabel: string;
  forgotPasswordUrl: string;
  submitAction: string;
}

export function LoginForm({ data }: { data: LoginFormData }) {
  return (
    <div className="bg-surface-container p-10 max-w-md w-full">
      <h2 className="font-headline italic text-3xl text-on-surface mb-8">{data.title}</h2>
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-2">
            {data.usernameLabel || 'Username'}
          </label>
          <input
            type="text"
            className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface placeholder:text-secondary font-body text-sm focus:outline-none focus:border-primary transition-all"
          />
        </div>
        <div>
          <label className="font-label uppercase text-xs tracking-widest text-secondary block mb-2">
            {data.passwordLabel || 'Password'}
          </label>
          <input
            type="password"
            className="w-full bg-transparent border-b border-outline-variant/40 py-3 text-on-surface placeholder:text-secondary font-body text-sm focus:outline-none focus:border-primary transition-all"
          />
        </div>
        {data.forgotPasswordUrl && (
          <a href={data.forgotPasswordUrl} className="font-label text-xs text-primary hover:underline block text-right">
            Forgot password?
          </a>
        )}
        <button
          type="submit"
          className="w-full bg-primary text-on-primary py-4 font-label uppercase text-xs tracking-widest font-bold hover:bg-primary-fixed transition-all"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
