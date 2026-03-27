'use client';

import { useState, useEffect } from 'react';

interface PimProduct {
  id: string;
  sku: string;
  name: string;
  attributes: Record<string, unknown>;
}

const PIM_API = process.env.NEXT_PUBLIC_FLEXCMS_API_URL ?? 'http://localhost:8080';

/** tut/model-comparison — side-by-side comparison of 2–3 PIM products. */
export function ModelComparison({ data }: { data: Record<string, unknown> }) {
  const productSkus = (data.productSkus as string[] | undefined) ?? [];
  const compareAttributes = (data.compareAttributes as string[] | undefined) ?? [];

  const [products, setProducts] = useState<PimProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productSkus.length === 0) { setLoading(false); return; }
    Promise.all(
      productSkus.map((sku) =>
        fetch(`${PIM_API}/api/pim/v1/products?sku=${encodeURIComponent(sku)}&size=1`)
          .then((r) => r.ok ? r.json() : null)
          .then((d) => d?.items?.[0] ?? null)
          .catch(() => null),
      ),
    )
      .then((results) => setProducts(results.filter(Boolean) as PimProduct[]))
      .finally(() => setLoading(false));
  }, [productSkus.join(',')]);

  if (loading) {
    return <div className="animate-pulse bg-gray-100 h-64 w-full rounded" />;
  }

  if (products.length === 0) return null;

  const specKeys = compareAttributes.length > 0
    ? compareAttributes
    : Array.from(new Set(products.flatMap((p) => Object.keys(p.attributes ?? {}))));

  return (
    <section className="py-16 px-6 bg-gray-950 text-white overflow-x-auto">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-extrabold tracking-tight mb-10 text-center">Model Comparison</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="text-left py-4 px-6 text-gray-400 font-medium text-xs uppercase tracking-widest w-1/4">
                Specification
              </th>
              {products.map((p) => (
                <th key={p.id} className="text-center py-4 px-6 text-white font-extrabold text-base">
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {specKeys.map((key) => {
              const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
              return (
                <tr key={key} className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 text-gray-400 font-medium">{label}</td>
                  {products.map((p) => {
                    const val = p.attributes?.[key];
                    return (
                      <td key={p.id} className="py-4 px-6 text-center font-semibold text-white">
                        {val !== undefined && val !== null ? String(val) : '—'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
