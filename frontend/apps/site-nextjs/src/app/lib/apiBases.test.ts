import { describe, expect, it } from 'vitest';
import { assetRewrites, liveApiUrl, previewApiUrl, publicApiUrl } from '../../../apiBases';

describe('apiBases', () => {
  it('defaults every server-side base to the local author API and the browser base to same-origin', () => {
    expect(liveApiUrl({})).toBe('http://localhost:8080');
    expect(previewApiUrl({})).toBe('http://localhost:8080');
    expect(publicApiUrl({})).toBe('');
  });

  it('points live pages at the configured public API (the publish tier in a deployment)', () => {
    expect(liveApiUrl({ NEXT_PUBLIC_FLEXCMS_API_URL: 'http://localhost:8081', FLEXCMS_API_URL: 'http://author:8080' }))
      .toBe('http://localhost:8081');
    expect(liveApiUrl({ NEXT_PUBLIC_FLEXCMS_API: 'http://publish:8081' })).toBe('http://publish:8081');
    expect(liveApiUrl({ FLEXCMS_API_URL: 'http://author:8080' })).toBe('http://author:8080');
  });

  it('keeps preview on author even when live pages read from publish', () => {
    const env = { NEXT_PUBLIC_FLEXCMS_API_URL: 'http://localhost:8081' };

    expect(previewApiUrl(env)).toBe('http://localhost:8080');
    expect(previewApiUrl({ ...env, FLEXCMS_PREVIEW_API_URL: 'http://author:8080' })).toBe('http://author:8080');
  });

  it('proxies /dam/renditions to the live API and /draft-dam/renditions to the preview API', () => {
    const rewrites = assetRewrites({
      NEXT_PUBLIC_FLEXCMS_API_URL: 'http://localhost:8081/',
      FLEXCMS_PREVIEW_API_URL: 'http://localhost:8080',
    });

    expect(rewrites).toEqual([
      { source: '/dam/renditions/:path*', destination: 'http://localhost:8081/dam/renditions/:path*' },
      { source: '/draft-dam/renditions/:path*', destination: 'http://localhost:8080/dam/renditions/:path*' },
    ]);
  });

  it('proxies both prefixes to author in the default local setup', () => {
    expect(assetRewrites({}).map((r) => r.destination)).toEqual([
      'http://localhost:8080/dam/renditions/:path*',
      'http://localhost:8080/dam/renditions/:path*',
    ]);
  });
});
