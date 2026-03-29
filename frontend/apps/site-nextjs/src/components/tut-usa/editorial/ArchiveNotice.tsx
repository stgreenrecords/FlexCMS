export interface ArchiveNoticeData {
  message: string;
  archiveDate: string;
  replacementLink: string;
}

interface Props {
  data: ArchiveNoticeData;
}

export function ArchiveNotice({ data }: Props) {
  const { message, archiveDate, replacementLink } = data;

  return (
    <aside
      role="note"
      className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-lg px-5 py-4 my-4"
    >
      <span className="text-amber-400 text-sm shrink-0 mt-0.5" aria-hidden="true">
        ⚠
      </span>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-label tracking-widest uppercase text-xs text-amber-400">
            Archived
          </span>
          {archiveDate && (
            <time
              dateTime={archiveDate}
              className="font-label tracking-widest uppercase text-xs text-on-surface-variant"
            >
              {archiveDate}
            </time>
          )}
        </div>
        <p className="text-sm text-on-surface-variant leading-relaxed">{message}</p>
        {replacementLink && (
          <a
            href={replacementLink}
            className="text-xs text-primary hover:underline self-start mt-1"
          >
            View Current Version
          </a>
        )}
      </div>
    </aside>
  );
}
