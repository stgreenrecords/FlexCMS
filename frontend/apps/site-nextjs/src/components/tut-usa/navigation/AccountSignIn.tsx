interface LinkItem { label: string; url: string }
interface Props { data: Record<string, unknown> }

export function AccountSignIn({ data }: Props) {
  const label = (data.label as string) ?? 'Sign In';
  const signInUrl = (data.signInUrl as string) ?? '/account/sign-in';
  const icon = (data.icon as string) ?? '';
  const showProfileState = (data.showProfileState as boolean) ?? false;
  const supportLinks = (data.supportLinks as LinkItem[]) ?? [];

  return (
    <div className="flex flex-col items-start gap-3">
      <a
        href={signInUrl}
        className="inline-flex items-center gap-2 text-xs text-white border border-white rounded px-4 py-2 uppercase tracking-widest hover:bg-white hover:text-black transition-colors duration-200"
      >
        {icon && (
          <img src={icon} alt="" aria-hidden="true" className="h-4 w-4 object-contain" />
        )}
        {label}
      </a>
      {showProfileState && (
        <p className="text-xs text-neutral-500">Profile state available</p>
      )}
      {supportLinks.length > 0 && (
        <ul className="flex flex-col gap-1 list-none m-0 p-0">
          {supportLinks.map((link, i) => (
            <li key={i}>
              <a
                href={link.url}
                className="text-xs text-neutral-400 hover:text-white transition-colors duration-200"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
