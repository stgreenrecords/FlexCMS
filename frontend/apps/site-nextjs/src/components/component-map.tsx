/**
 * Reference site component map — registers React renderers for each CMS component type.
 * This is where the frontend team maps backend resourceTypes to React components.
 *
 * The backend team defines the data schema (the contract).
 * The frontend team builds the renderer (this file).
 * Neither side touches the other's code.
 */
import { ComponentMapper, type FlexCmsRenderer } from '@flexcms/react';

// ---------------------------------------------------------------------------
// Component Renderers
// ---------------------------------------------------------------------------

/** flexcms/rich-text — renders HTML content */
function RichText({ data }: { data: Record<string, unknown> }) {
  return (
    <div
      className="prose max-w-none"
      dangerouslySetInnerHTML={{ __html: (data.content as string) ?? '' }}
    />
  );
}

/** flexcms/image — renders a responsive image */
function Image({ data }: { data: Record<string, unknown> }) {
  return (
    <figure>
      <img
        src={data.src as string}
        alt={(data.alt as string) ?? ''}
        width={data.width as number}
        height={data.height as number}
        loading="lazy"
      />
      {data.caption && <figcaption>{data.caption as string}</figcaption>}
    </figure>
  );
}

/** flexcms/container — renders children in a layout */
function Container({ data, children }: { data: Record<string, unknown>; children?: React.ReactNode }) {
  const layout = (data.layout as string) ?? 'single';
  const layoutClass = {
    single: '',
    'two-equal': 'grid grid-cols-2 gap-6',
    'three-equal': 'grid grid-cols-3 gap-6',
  }[layout] ?? '';

  return <div className={layoutClass}>{children}</div>;
}

/** flexcms/shared-header — site header */
function Header({ data }: { data: Record<string, unknown> }) {
  return (
    <header className="border-b py-4 px-6">
      <nav className="flex items-center gap-6">
        <strong>{(data.logo as string) ?? 'FlexCMS Site'}</strong>
      </nav>
    </header>
  );
}

/** flexcms/shared-footer — site footer */
function Footer({ data }: { data: Record<string, unknown> }) {
  return (
    <footer className="border-t py-8 px-6 text-center text-sm text-gray-500">
      © {new Date().getFullYear()} FlexCMS Site
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Build the component map (the bridge between contract and rendering)
// ---------------------------------------------------------------------------

export const componentMap = new ComponentMapper<any>()
  .registerAll({
    'flexcms/rich-text': RichText,
    'flexcms/image': Image,
    'flexcms/container': Container,
    'flexcms/shared-header': Header,
    'flexcms/shared-footer': Footer,
  })
  .setFallback(({ data }: any) => (
    <div className="p-4 border border-dashed border-gray-300 rounded">
      <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>
    </div>
  ));

