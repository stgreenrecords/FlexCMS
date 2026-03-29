'use client';

import { useState, useEffect } from 'react';

interface PimProduct {
  id: string;
  sku: string;
  name: string;
  attributes: Record<string, unknown>;
  status: string;
}

const PIM_API =
  process.env.NEXT_PUBLIC_FLEXCMS_API_URL ??
  process.env.NEXT_PUBLIC_FLEXCMS_API ??
  '';

/** tut/product-teaser — fetches a PIM product by SKU and renders a configurable teaser. */
export function ProductTeaser({ data }: { data: Record<string, unknown> }) {
  const productSku = data.productSku as string | undefined;
  const displayMode = (data.displayMode as string | undefined) ?? 'card';
  const showPrice = (data.showPrice as boolean | undefined) ?? false;
  const ctaLabel = (data.ctaLabel as string | undefined) ?? 'Discover';
  const ctaLink = data.ctaLink as string | undefined;

  const [product, setProduct] = useState<PimProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productSku) { setLoading(false); return; }
    fetch(`${PIM_API}/api/pim/v1/products?sku=${encodeURIComponent(productSku)}&size=1`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setProduct(data?.items?.[0] ?? null))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [productSku]);

  if (loading) {
    return <div className="animate-pulse bg-gray-200 rounded h-64 w-full" />;
  }

  if (!product) {
    return null;
  }

  const heroImage = product.attributes?.image as string | undefined;
  const price = product.attributes?.msrp as string | undefined;

  if (displayMode === 'hero') {
    return (
      <section
        className="relative min-h-[70vh] flex items-end justify-start overflow-hidden"
        style={heroImage ? { backgroundImage: `url(${heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: '#111' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="relative z-10 p-12 text-white max-w-2xl">
          <h2 className="text-5xl font-extrabold mb-4">{product.name}</h2>
          {showPrice && price && <p className="text-2xl font-light mb-8">From {price}</p>}
          {ctaLink && (
            <a href={ctaLink} className="inline-block px-10 py-4 text-sm font-bold uppercase tracking-widest border-2 border-white hover:bg-white hover:text-black transition-all">
              {ctaLabel}
            </a>
          )}
        </div>
      </section>
    );
  }

  if (displayMode === 'compact') {
    return (
      <div className="flex items-center gap-6 p-6 bg-white border border-gray-100">
        {heroImage && <img src={heroImage} alt={product.name} className="w-24 h-16 object-cover flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 truncate">{product.name}</h3>
          {showPrice && price && <p className="text-sm text-gray-500">{price}</p>}
        </div>
        {ctaLink && (
          <a href={ctaLink} className="flex-shrink-0 text-xs font-bold uppercase tracking-widest text-gray-900 border-b border-gray-900">
            {ctaLabel}
          </a>
        )}
      </div>
    );
  }

  // card (default)
  return (
    <article className="flex flex-col bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 group">
      {heroImage && (
        <div className="aspect-[16/9] overflow-hidden">
          <img src={heroImage} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        </div>
      )}
      <div className="p-6 flex flex-col gap-3">
        <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
        {showPrice && price && <p className="text-gray-500 text-sm">{price}</p>}
        {ctaLink && (
          <a href={ctaLink} className="self-start text-xs font-bold uppercase tracking-widest text-gray-900 border-b border-gray-900 hover:opacity-60 transition-opacity">
            {ctaLabel}
          </a>
        )}
      </div>
    </article>
  );
}
