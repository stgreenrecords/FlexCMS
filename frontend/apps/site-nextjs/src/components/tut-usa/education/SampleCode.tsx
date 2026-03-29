export type CodeLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'curl'
  | 'go'
  | 'csharp';

export interface SampleCodeData {
  title: string;
  language: CodeLanguage;
  code: string;
  repositoryUrl: string;
}

const LANGUAGE_LABELS: Record<CodeLanguage, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  java: 'Java',
  curl: 'cURL',
  go: 'Go',
  csharp: 'C#',
};

interface Props {
  data: SampleCodeData;
}

export function SampleCode({ data }: Props) {
  const { title, language, code, repositoryUrl } = data;
  const languageLabel = LANGUAGE_LABELS[language] ?? language;

  return (
    <div className="bg-surface-container border border-outline-variant rounded-2xl overflow-hidden flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <h3 className="font-headline text-base text-on-surface">{title}</h3>
          <span
            className="text-xs font-label font-semibold px-2.5 py-0.5 rounded-full"
            style={{
              backgroundColor: 'var(--color-secondary-container)',
              color: 'var(--color-on-secondary-container)',
            }}
          >
            {languageLabel}
          </span>
        </div>

        {repositoryUrl && (
          <a
            href={repositoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-label text-secondary hover:text-primary transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
            View Repository
          </a>
        )}
      </div>

      {/* Code block */}
      <pre
        className="p-5 text-xs font-mono text-on-surface overflow-x-auto leading-relaxed"
        style={{ backgroundColor: 'var(--color-surface-variant)' }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
