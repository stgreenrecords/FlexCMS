export interface ColorSwatch {
  name: string;
  hex: string;
  usage: string;
}

export interface ColorPaletteData {
  title: string;
  colors: ColorSwatch[];
  usageNotes: string;
}

export function ColorPalette({ data }: { data: ColorPaletteData }) {
  return (
    <section className="py-10 bg-surface">
      {data.title && (
        <h2 className="text-2xl font-semibold text-on-surface mb-6">{data.title}</h2>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {data.colors?.map((color, i) => (
          <div key={i} className="bg-surface-container-low rounded-lg overflow-hidden">
            <div
              className="h-20 w-full"
              style={{ backgroundColor: color.hex }}
              aria-label={`Color swatch: ${color.name}`}
            />
            <div className="p-3">
              <p className="text-on-surface font-medium text-sm">{color.name}</p>
              <p className="text-on-surface-variant text-xs font-mono mt-0.5">{color.hex}</p>
              {color.usage && (
                <p className="text-on-surface-variant/70 text-xs mt-1">{color.usage}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {data.usageNotes && (
        <p className="text-on-surface-variant text-sm">{data.usageNotes}</p>
      )}
    </section>
  );
}
