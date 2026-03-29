import type { PageResponse } from '@flexcms/sdk';

const AUTHOR_ASSET_PREFIX = '/api/author/assets/';

export function normalizePageAssetUrls(pageData: PageResponse): PageResponse {
  return {
    page: pageData.page,
    components: pageData.components.map((component) => normalizeComponent(component)),
  };
}

function normalizeComponent(component: PageResponse['components'][number]): PageResponse['components'][number] {
  return {
    ...component,
    data: normalizeValue(component.data) as Record<string, unknown>,
    children: component.children?.map((child) => normalizeComponent(child)),
  };
}

function normalizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    if (value.startsWith(AUTHOR_ASSET_PREFIX)) {
      // Keep DAM asset URLs relative so the current host/proxy can serve them.
      return value;
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, normalizeValue(nested)]),
    );
  }

  return value;
}
