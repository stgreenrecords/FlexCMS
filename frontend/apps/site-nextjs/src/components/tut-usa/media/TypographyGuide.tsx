export interface TypographyStyle {
  name: string;
  fontFamily: string;
  weight: string;
  size: string;
  usage: string;
}

export interface TypographyGuideData {
  title: string;
  styles: TypographyStyle[];
  usageNotes: string;
}

export function TypographyGuide({ data }: { data: TypographyGuideData }) {
  return (
    <section className="py-10 bg-surface">
      {data.title && (
        <h2 className="text-2xl font-semibold text-on-surface mb-6">{data.title}</h2>
      )}

      <div className="space-y-4">
        {data.styles?.map((style, i) => (
          <div
            key={i}
            className="bg-surface-container-low rounded-lg p-5 flex flex-col md:flex-row md:items-center gap-4"
          >
            <div className="flex-1">
              <p
                style={{
                  fontFamily: style.fontFamily,
                  fontWeight: style.weight,
                  fontSize: style.size,
                }}
                className="text-on-surface leading-tight"
              >
                Aa — {style.name}
              </p>
            </div>
            <div className="md:w-56 flex-shrink-0 text-xs text-on-surface-variant space-y-0.5">
              <p><span className="font-mono text-primary">Font:</span> {style.fontFamily}</p>
              <p><span className="font-mono text-primary">Weight:</span> {style.weight}</p>
              <p><span className="font-mono text-primary">Size:</span> {style.size}</p>
              {style.usage && (
                <p className="text-on-surface-variant/60">{style.usage}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {data.usageNotes && (
        <p className="mt-6 text-on-surface-variant text-sm">{data.usageNotes}</p>
      )}
    </section>
  );
}
