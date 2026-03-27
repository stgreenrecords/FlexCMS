/** tut/testimonial — pull-quote with author attribution. */
export function Testimonial({ data }: { data: Record<string, unknown> }) {
  const quote = data.quote as string | undefined;
  const author = data.author as string | undefined;
  const source = data.source as string | undefined;
  const image = data.image as string | undefined;

  if (!quote) return null;

  return (
    <section className="py-20 px-6 bg-gray-950">
      <div className="max-w-3xl mx-auto text-center">
        <svg className="w-10 h-10 text-white/20 mx-auto mb-8" fill="currentColor" viewBox="0 0 32 32" aria-hidden>
          <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
        </svg>
        <blockquote className="text-2xl md:text-3xl font-light text-white leading-relaxed italic mb-10">
          &ldquo;{quote}&rdquo;
        </blockquote>
        <div className="flex items-center justify-center gap-4">
          {image && (
            <img src={image} alt={author ?? ''} className="w-12 h-12 rounded-full object-cover" loading="lazy" />
          )}
          <div className="text-left">
            {author && <p className="text-white font-bold text-sm">{author}</p>}
            {source && <p className="text-gray-500 text-xs">{source}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
