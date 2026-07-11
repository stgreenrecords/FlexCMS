import { describe, expect, it } from 'vitest';
import type { PageResponse } from '@flexcms/sdk';
import { normalizePageAssetUrls, TUT_IMAGE_FALLBACK } from './normalizeAssetUrls';

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

  it('preserves valid and author asset URLs', () => {
    const result = normalizePageAssetUrls({
      ...pageData,
      components: [
        {
          name: 'image',
          resourceType: 'flexcms/image',
          data: {
            valid: '/tut-usa/assets/images/valid.png',
            author: 'http://localhost:8080/api/author/assets/abc',
          },
        },
      ],
    });

    expect(result.components[0].data).toEqual({
      valid: '/tut-usa/assets/images/valid.png',
      author: '/api/author/assets/abc',
    });
  });
});

