export interface DatasetDownloadData {
  title: string;
  description: string;
  /** File — 48×48 icon */
  file: string;
  format: string;
  license: string;
}

interface Props {
  data: DatasetDownloadData;
}

export function DatasetDownload({ data }: Props) {
  const { title, description, file, format, license } = data;

  return (
    <div className="bg-surface-container-low border border-outline-variant/20 rounded-xl p-6 flex gap-5 items-start">
      {file && (
        <img
          src={file}
          alt=""
          width={48}
          height={48}
          aria-hidden="true"
          className="shrink-0 w-12 h-12 object-contain"
        />
      )}
      <div className="flex flex-col gap-2 flex-1">
        <h3 className="font-headline italic text-on-surface text-lg">{title}</h3>
        <p className="text-sm text-on-surface-variant leading-relaxed">{description}</p>
        <div className="flex flex-wrap gap-4 text-xs font-label tracking-widest uppercase text-on-surface-variant mt-1">
          {format && <span>Format: <span className="text-primary">{format}</span></span>}
          {license && <span>License: <span className="text-on-surface">{license}</span></span>}
        </div>
        {file && (
          <a
            href={file}
            download
            className="font-label tracking-widest uppercase text-xs text-primary hover:underline self-start mt-1"
          >
            Download Dataset
          </a>
        )}
      </div>
    </div>
  );
}
