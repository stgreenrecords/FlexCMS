export interface SdkDownloadData {
  title: string;
  platform: string;
  version: string;
  downloadUrl: string;
  documentationUrl: string;
}

interface Props {
  data: SdkDownloadData;
}

export function SdkDownload({ data }: Props) {
  const { title, platform, version, downloadUrl, documentationUrl } = data;

  return (
    <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 flex flex-col gap-5">
      <div className="flex items-start gap-4">
        <div
          className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-primary-container)' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>

        <div className="flex flex-col gap-1 flex-1">
          <h3 className="font-headline text-lg text-on-surface">{title}</h3>
          <div className="flex items-center gap-3 text-sm text-secondary font-label">
            <span>{platform}</span>
            <span aria-hidden="true">·</span>
            <span
              className="text-xs px-2 py-0.5 rounded border border-outline-variant"
            >
              v{version}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href={downloadUrl}
          download
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-label font-medium transition-opacity hover:opacity-90"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-on-primary)',
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
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
          Download SDK
        </a>

        <a
          href={documentationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-label font-medium text-primary border border-primary hover:bg-surface-container transition-colors"
        >
          Documentation
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
    </div>
  );
}
