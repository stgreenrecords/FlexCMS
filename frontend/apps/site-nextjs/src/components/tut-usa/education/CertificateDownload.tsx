export interface CertificateDownloadData {
  title: string;
  recipientName: string;
  completionDate: string;
  /** Certificate file asset URL */
  certificateFile: string;
}

interface Props {
  data: CertificateDownloadData;
}

export function CertificateDownload({ data }: Props) {
  const { title, recipientName, completionDate, certificateFile } = data;

  const formattedDate = completionDate
    ? new Date(completionDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : completionDate;

  return (
    <div className="bg-surface-container border border-outline-variant rounded-2xl p-8 flex flex-col items-center gap-6 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-primary-container)' }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="6" />
          <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
        </svg>
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="font-headline text-2xl text-on-surface">{title}</h2>
        <p className="text-sm text-secondary font-label">Awarded to</p>
        <p className="font-headline text-xl text-primary">{recipientName}</p>
        <p className="text-sm text-secondary font-label">{formattedDate}</p>
      </div>

      <a
        href={certificateFile}
        download
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-label font-medium transition-opacity hover:opacity-90"
        style={{
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-on-primary)',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Download Certificate
      </a>
    </div>
  );
}
