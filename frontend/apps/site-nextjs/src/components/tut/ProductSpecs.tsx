'use client';

import { useState, useEffect } from 'react';

interface PimProduct {
  id: string;
  sku: string;
  name: string;
  attributes: Record<string, unknown>;
}

const PIM_API = process.env.NEXT_PUBLIC_FLEXCMS_API_URL ?? 'http://localhost:8080';

/** tut/product-specs — fetches a PIM product and renders a specs table. */
export function ProductSpecs({ data }: { data: Record<string, unknown> }) {
  const productSku = data.productSku as string | undefined;
  const highlightedSpecs = (data.highlightedSpecs as string[] | undefined) ?? [];

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
    return <div className="animate-pulse bg-gray-100 h-48 w-full rounded" />;
  }

  if (!product) return null;

  const attrs = product.attributes ?? {};
  const specKeys = highlightedSpecs.length > 0 ? highlightedSpecs : Object.keys(attrs);

  return (
    <section className="py-16 px-6 bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-extrabold tracking-tight mb-2">{product.name}</h2>
        <p className="text-gray-400 text-sm uppercase tracking-widest mb-10">Technical Specifications</p>
        <dl className="divide-y divide-white/10">
          {specKeys.map((key) => {
            const value = attrs[key];
            if (value === undefined || value === null) return null;
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            return (
              <div key={key} className="flex justify-between py-4 gap-8">
                <dt className="text-gray-400 text-sm font-medium w-1/2">{label}</dt>
                <dd className="text-white font-bold text-sm text-right w-1/2">{String(value)}</dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
