import { describe, expect, it } from 'vitest';
import type { PageResponse } from '@flexcms/sdk';
import {
  normalizeAssetUrlString,
  normalizePageAssetUrls,
  TUT_IMAGE_FALLBACK,
} from './normalizeAssetUrls';

const ID = '11111111-2222-3333-4444-555555555555';
const OTHER = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

const pageData: PageResponse = {
  page: {
    path: 'content.tut-usa.en.vehicles',
    title: 'Vehicles',
    description: '',
    template: 'model-overview-page',
    locale: 'en',
    lastModified: '',
  },
  components: [],
};

function withData(data: Record<string, unknown>, children?: PageResponse['components']): PageResponse {
  return {
    ...pageData,
    components: [{ name: 'image', resourceType: 'flexcms/image', data, children }],
  };
}

describe('normalizePageAssetUrls', () => {
  it('replaces missing DAM paths in nested component data with the public fallback', () => {
    const result = normalizePageAssetUrls({
      ...pageData,
      components: [
        {
          name: 'page-header',
          resourceType: 'tut-usa/layout-page-structure/page-header',
          data: {
            backgroundImage: '/dam/tut-usa/missing/tut-usa-vehicles-page-header.jpg',
            gallery: ['/dam/tut-usa/missing/card.jpg', '/tut-usa/assets/images/valid.png'],
          },
        },
      ],
    });

    expect(result.components[0].data).toEqual({
      backgroundImage: TUT_IMAGE_FALLBACK,
      gallery: [TUT_IMAGE_FALLBACK, '/tut-usa/assets/images/valid.png'],
    });
  });

  it('rewrites legacy author asset URLs, relative or on any host, to the canonical URL', () => {
    const result = normalizePageAssetUrls(
      withData({
        relative: `/api/author/assets/${ID}/content`,
        localhost: `http://localhost:8080/api/author/assets/${ID}/content`,
        container: `http://author:8080/api/author/assets/${OTHER}/content`,
        external: `https://author.example.com/api/author/assets/${ID}/content`,
      }),
    );

    expect(result.components[0].data).toEqual({
      relative: `/dam/renditions/${ID}`,
      localhost: `/dam/renditions/${ID}`,
      container: `/dam/renditions/${OTHER}`,
      external: `/dam/renditions/${ID}`,
    });
  });

  it('makes absolute canonical URLs relative so the site proxy serves them', () => {
    const result = normalizePageAssetUrls(
      withData({
        original: `http://localhost:8081/dam/renditions/${ID}`,
        rendition: `https://publish.example.com/dam/renditions/${ID}/thumbnail`,
      }),
    );

    expect(result.components[0].data).toEqual({
      original: `/dam/renditions/${ID}`,
      rendition: `/dam/renditions/${ID}/thumbnail`,
    });
  });

  it('leaves relative canonical URLs and unrelated values alone in live mode', () => {
    const data = {
      canonical: `/dam/renditions/${ID}/web-small`,
      publicImage: '/tut-usa/assets/images/valid.png',
      link: '/tut-usa/vehicles',
      count: 3,
      flag: true,
      empty: null,
    };

    expect(normalizePageAssetUrls(withData(data), 'live').components[0].data).toEqual(data);
  });

  it('routes every asset URL through /draft-dam in preview mode', () => {
    const result = normalizePageAssetUrls(
      withData({
        canonical: `/dam/renditions/${ID}`,
        legacy: `http://localhost:8080/api/author/assets/${ID}/content`,
        rendition: `http://localhost:8080/dam/renditions/${ID}/thumbnail`,
        publicImage: '/tut-usa/assets/images/valid.png',
      }),
      'preview',
    );

    expect(result.components[0].data).toEqual({
      canonical: `/draft-dam/renditions/${ID}`,
      legacy: `/draft-dam/renditions/${ID}`,
      rendition: `/draft-dam/renditions/${ID}/thumbnail`,
      publicImage: '/tut-usa/assets/images/valid.png',
    });
  });

  it('rewrites URLs embedded in rich text, every occurrence', () => {
    const html = `<p><img src="/api/author/assets/${ID}/content"><img src='http://localhost:8080/dam/renditions/${OTHER}'></p>`;

    expect(normalizeAssetUrlString(html)).toBe(
      `<p><img src="/dam/renditions/${ID}"><img src='/dam/renditions/${OTHER}'></p>`,
    );
    expect(normalizeAssetUrlString(html, 'preview')).toBe(
      `<p><img src="/draft-dam/renditions/${ID}"><img src='/draft-dam/renditions/${OTHER}'></p>`,
    );
  });

  it('is idempotent: normalising a preview URL again does not double the prefix', () => {
    const once = normalizeAssetUrlString(`/dam/renditions/${ID}`, 'preview');

    expect(normalizeAssetUrlString(once, 'preview')).toBe(`/draft-dam/renditions/${ID}`);
  });

  it('normalises nested children, arrays, and objects', () => {
    const result = normalizePageAssetUrls(
      withData({ cards: [{ image: { src: `/api/author/assets/${ID}/content` } }] }, [
        { name: 'child', resourceType: 'flexcms/image', data: { src: `/api/author/assets/${OTHER}/content` } },
      ]),
    );

    expect(result.components[0].data).toEqual({ cards: [{ image: { src: `/dam/renditions/${ID}` } }] });
    expect(result.components[0].children?.[0].data).toEqual({ src: `/dam/renditions/${OTHER}` });
  });

  it('does not treat look-alike paths as asset URLs', () => {
    // No /content suffix and no UUID: not the author streaming route.
    expect(normalizeAssetUrlString('/api/author/assets/abc')).toBe('/api/author/assets/abc');
    expect(normalizeAssetUrlString('/dam/renditions/not-a-uuid', 'preview')).toBe('/dam/renditions/not-a-uuid');
  });
});
