export interface PublicationCitationData {
  title: string;
  authors: string[];
  journal: string;
  publicationDate: string;
  doi: string;
}

interface Props {
  data: PublicationCitationData;
}

export function PublicationCitation({ data }: Props) {
  const { title, authors, journal, publicationDate, doi } = data;

  return (
    <div className="bg-surface-container-low border border-outline-variant/20 rounded-lg p-5 flex flex-col gap-2">
      <p className="font-label tracking-widest uppercase text-xs text-primary mb-1">
        Citation
      </p>
      <h4 className="font-headline italic text-on-surface text-base leading-snug">{title}</h4>
      {authors.length > 0 && (
        <p className="text-sm text-on-surface-variant">
          {authors.join(', ')}
        </p>
      )}
      <div className="flex flex-wrap gap-4 text-xs text-on-surface-variant mt-1">
        {journal && <span className="italic">{journal}</span>}
        {publicationDate && <span>{publicationDate}</span>}
        {doi && (
          <a
            href={`https://doi.org/${doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            DOI: {doi}
          </a>
        )}
      </div>
    </div>
  );
}
