export interface RevisionNoticeData {
  message: string;
  revisionDate: string;
  version: string;
  changeLogUrl: string;
}

interface Props {
  data: RevisionNoticeData;
}

export function RevisionNotice({ data }: Props) {
  const { message, revisionDate, version, changeLogUrl } = data;

  return (
    <aside className="flex items-start gap-3 bg-surface-container-low border border-outline-variant/20 rounded-lg px-5 py-4 my-4">
      <span className="text-primary text-sm shrink-0 mt-0.5" aria-hidden="true">
        ↻
      </span>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-label tracking-widest uppercase text-xs text-on-surface">
            Revision Notice
          </span>
          {version && (
            <span className="font-label tracking-widest uppercase text-xs text-primary">
              v{version}
            </span>
          )}
          {revisionDate && (
            <time
              dateTime={revisionDate}
              className="font-label tracking-widest uppercase text-xs text-on-surface-variant"
            >
              {revisionDate}
            </time>
          )}
        </div>
        <p className="text-sm text-on-surface-variant leading-relaxed">{message}</p>
        {changeLogUrl && (
          <a
            href={changeLogUrl}
            className="text-xs text-primary hover:underline self-start mt-1"
          >
            View Changelog
          </a>
        )}
      </div>
    </aside>
  );
}
