export interface VideoEmbedData {
  title: string;
  videoUrl: string;
  /** Poster image — 1280×720 */
  posterImage: string;
  transcript: string;
  autoplay: boolean;
}

export function VideoEmbed({ data }: { data: VideoEmbedData }) {
  return (
    <section className="py-10 bg-surface">
      {data.title && (
        <h2 className="text-2xl font-semibold text-on-surface mb-4">{data.title}</h2>
      )}
      <div className="aspect-video bg-surface-container-highest rounded-lg overflow-hidden">
        <video
          src={data.videoUrl}
          poster={data.posterImage}
          controls
          autoPlay={data.autoplay}
          muted={data.autoplay}
          className="w-full h-full object-cover"
          aria-label={data.title}
        />
      </div>
      {data.transcript && (
        <details className="mt-4">
          <summary className="text-primary cursor-pointer text-sm font-medium">
            View Transcript
          </summary>
          <div className="mt-2 p-4 bg-surface-container-low rounded text-on-surface-variant text-sm whitespace-pre-wrap">
            {data.transcript}
          </div>
        </details>
      )}
    </section>
  );
}
