import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getNode, getChildren, dotPathToUrl } from '@/lib/flexcms';
import type { WkndNode } from '@/lib/flexcms';
import { ComponentRenderer } from '@/components/ComponentRenderer';

interface PageProps {
  params: { slug?: string[] };
}

function buildDotPath(slug: string[] | undefined): string {
  if (!slug || slug.length === 0) {
    return 'wknd.language-masters.en';
  }
  // If slug already starts with 'wknd', use as-is; otherwise prefix
  const joined = slug.join('.');
  if (joined.startsWith('wknd.')) return joined;
  return 'wknd.language-masters.en.' + joined;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const dotPath = buildDotPath(params.slug);
  const node = await getNode(dotPath);
  if (!node) return {};
  return {
    title: node.properties?.pageTitle ?? node.properties?.title ?? node.name,
    description: node.properties?.description ?? undefined,
  };
}

export default async function SitePage({ params }: PageProps) {
  const dotPath = buildDotPath(params.slug);
  const node = await getNode(dotPath);

  if (!node) {
    notFound();
  }

  // Fetch header and footer XF nodes
  const [headerNode, footerNode] = await Promise.all([
    getNode('experience-fragments.wknd.language-masters.en.site.header.master'),
    getNode('experience-fragments.wknd.language-masters.en.site.footer.master'),
  ]);

  const headerComponents = headerNode?.properties?.components ?? [];
  const footerComponents = footerNode?.properties?.components ?? [];
  const pageComponents = node.properties?.components ?? [];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      {headerComponents.length > 0 && (
        <header className="sticky top-0 z-50 bg-wknd-black text-white">
          {headerComponents.map((c, i) => (
            <ComponentRenderer key={i} component={c} />
          ))}
        </header>
      )}

      {/* Main content */}
      <main className="flex-1">
        {pageComponents.map((c, i) => (
          <ComponentRenderer key={i} component={c} />
        ))}
      </main>

      {/* Footer */}
      {footerComponents.length > 0 && (
        <footer className="bg-wknd-black text-white py-12">
          {footerComponents.map((c, i) => (
            <ComponentRenderer key={i} component={c} />
          ))}
        </footer>
      )}
    </div>
  );
}
