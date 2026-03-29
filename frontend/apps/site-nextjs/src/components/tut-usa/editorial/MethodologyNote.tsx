export interface MethodologyNoteData {
  title: string;
  body: string;
  owner: string;
  version: string;
}

const safeHtml = (html: string) =>
  html.replace(/<script[\s\S]*?<\/script>/gi, '');

interface Props {
  data: MethodologyNoteData;
}

export function MethodologyNote({ data }: Props) {
  const { title, body, owner, version } = data;

  return (
    <aside className="border border-outline-variant/20 rounded-xl p-6 bg-surface-container-low my-6">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <h3 className="font-headline italic text-on-surface text-lg">{title}</h3>
        <div className="flex items-center gap-3 text-xs font-label tracking-widest uppercase">
          {version && (
            <span className="text-primary border border-primary/30 rounded px-2 py-0.5">
              v{version}
            </span>
          )}
          {owner && (
            <span className="text-on-surface-variant">{owner}</span>
          )}
        </div>
      </div>
      <div
        className="prose prose-invert max-w-none text-sm text-on-surface-variant leading-relaxed"
        dangerouslySetInnerHTML={{ __html: safeHtml(body) }}
      />
    </aside>
  );
}
