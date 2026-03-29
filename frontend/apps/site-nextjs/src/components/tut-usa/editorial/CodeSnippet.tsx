export interface CodeSnippetData {
  title: string;
  code: string;
  language: 'javascript' | 'typescript' | 'java' | 'bash' | 'json' | 'html' | 'css' | 'other';
  showLineNumbers: boolean;
}

interface Props {
  data: CodeSnippetData;
}

export function CodeSnippet({ data }: Props) {
  const { title, code, language, showLineNumbers } = data;

  const lines = code.split('\n');

  return (
    <div className="rounded-lg overflow-hidden border border-outline-variant/20 my-6">
      <div className="flex items-center justify-between px-4 py-2 bg-surface-container-low border-b border-outline-variant/20">
        {title && (
          <span className="font-label tracking-widest uppercase text-xs text-on-surface-variant">
            {title}
          </span>
        )}
        <span className="font-label tracking-widest uppercase text-xs text-primary ml-auto">
          {language}
        </span>
      </div>
      <div className="overflow-x-auto">
        <pre className="bg-surface-container-low p-4 text-sm font-mono text-on-surface-variant">
          {showLineNumbers ? (
            <code>
              {lines.map((line, i) => (
                <span key={i} className="flex">
                  <span className="select-none text-outline-variant/40 w-8 shrink-0 text-right pr-3">
                    {i + 1}
                  </span>
                  <span>{line}</span>
                </span>
              ))}
            </code>
          ) : (
            <code>{code}</code>
          )}
        </pre>
      </div>
    </div>
  );
}
