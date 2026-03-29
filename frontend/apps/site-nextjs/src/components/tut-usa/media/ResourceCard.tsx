export interface ResourceCardCta {
  label: string;
  url: string;
}

export interface ResourceCardData {
  title: string;
  description: string;
  /** Thumbnail — 400×300 */
  thumbnail: string;
  resourceType: 'guide' | 'video' | 'whitepaper' | 'report' | 'ebook' | 'template';
  cta: ResourceCardCta;
}

const resourceTypeLabel: Record<ResourceCardData['resourceType'], string> = {
  guide: 'Guide',
  video: 'Video',
  whitepaper: 'Whitepaper',
  report: 'Report',
  ebook: 'eBook',
  template: 'Template',
};

export function ResourceCard({ data }: { data: ResourceCardData }) {
  return (
    <article className="bg-surface-container-low rounded-lg overflow-hidden flex flex-col hover:bg-surface-container-highest transition group">
      <div className="aspect-video bg-surface-container-highest overflow-hidden">
        {data.thumbnail ? (
          <img
            src={data.thumbnail}
            alt={data.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-sm font-medium uppercase tracking-wide">
            {resourceTypeLabel[data.resourceType] || 'Resource'}
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <span className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
          {resourceTypeLabel[data.resourceType]}
        </span>

        {data.title && (
          <h3 className="text-on-surface font-semibold mb-2 leading-snug">{data.title}</h3>
        )}

        {data.description && (
          <p className="text-on-surface-variant text-sm mb-4 flex-1">{data.description}</p>
        )}

        {data.cta?.label && (
          <a
            href={data.cta.url}
            className="inline-block mt-auto text-primary text-sm font-semibold underline"
          >
            {data.cta.label} &#8594;
          </a>
        )}
      </div>
    </article>
  );
}
