export interface ProductSpec {
  name: string;
  value: string;
}

export interface ProductSpecGroup {
  groupName: string;
  specs: ProductSpec[];
}

export interface ProductDetailData {
  productName: string;
  sku: string;
  /** Gallery images — 960×720 each */
  gallery: string[];
  description: string;
  price: number;
  specifications: ProductSpecGroup[];
}

export function ProductDetail({ data }: { data: ProductDetailData }) {
  const firstImage = data.gallery?.[0];
  return (
    <section className="bg-background py-12 px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          {firstImage && (
            <img src={firstImage} alt={data.productName} className="w-full object-cover mb-4" />
          )}
          {data.gallery && data.gallery.length > 1 && (
            <div className="flex gap-2">
              {data.gallery.slice(1).map((img, i) => (
                <img key={i} src={img} alt="" className="w-20 h-20 object-cover border border-outline-variant/30" />
              ))}
            </div>
          )}
        </div>
        <div>
          {data.sku && (
            <span className="font-label uppercase text-xs tracking-[0.3em] text-secondary block mb-2">{data.sku}</span>
          )}
          <h1 className="font-headline italic text-4xl text-on-surface mb-4">{data.productName}</h1>
          <span className="font-headline text-3xl text-primary block mb-6">
            {typeof data.price === 'number' ? `$${data.price.toLocaleString()}` : data.price}
          </span>
          {data.description && (
            <p className="font-body text-sm text-secondary mb-8 leading-relaxed">{data.description}</p>
          )}
          {data.specifications && data.specifications.length > 0 && (
            <div className="space-y-4">
              {data.specifications.map((group, i) => (
                <div key={i}>
                  <h3 className="font-label uppercase text-xs tracking-widest text-primary mb-2">{group.groupName}</h3>
                  <table className="w-full text-sm">
                    <tbody>
                      {group.specs?.map((spec, j) => (
                        <tr key={j} className="border-b border-outline-variant/20">
                          <td className="py-2 font-label text-secondary pr-4">{spec.name}</td>
                          <td className="py-2 font-body text-on-surface">{spec.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
