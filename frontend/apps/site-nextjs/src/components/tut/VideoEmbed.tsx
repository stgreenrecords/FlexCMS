/** tut/video-embed — renders a YouTube/Vimeo embed or a DAM video player. */
export function VideoEmbed({ data }: { data: Record<string, unknown> }) {
  const videoUrl = data.videoUrl as string | undefined;
  const damVideo = data.damVideo as string | undefined;
  const posterImage = data.posterImage as string | undefined;
  const autoplay = (data.autoplay as boolean | undefined) ?? false;
  const title = (data.title as string | undefined) ?? 'Video';

  const getEmbedUrl = (url: string): string | null => {
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}${autoplay ? '?autoplay=1' : ''}`;
    const vm = url.match(/vimeo\.com\/(\d+)/);
    if (vm) return `https://player.vimeo.com/video/${vm[1]}${autoplay ? '?autoplay=1' : ''}`;
    return null;
  };

  const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : null;

  return (
    <section className="py-16 px-6 bg-black">
      <div className="max-w-5xl mx-auto">
        {embedUrl ? (
          <div className="aspect-video">
            <iframe
              src={embedUrl}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        ) : damVideo ? (
          <div className="aspect-video">
            <video
              src={damVideo}
              poster={posterImage}
              controls
              autoPlay={autoplay}
              className="w-full h-full object-cover"
              title={title}
            />
          </div>
        ) : posterImage ? (
          <div className="aspect-video overflow-hidden">
            <img src={posterImage} alt={title} className="w-full h-full object-cover opacity-60" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
