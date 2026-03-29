import type { PageResponse } from '@flexcms/sdk';

const AUTHOR_ASSET_PREFIX = '/api/author/assets/';

export function normalizePageAssetUrls(pageData: PageResponse, apiUrl: string): PageResponse {
  const normalizedApiUrl = apiUrl.replace(/\/$/, '');

  return {
    page: pageData.page,
    components: pageData.components.map((component) => normalizeComponent(component, normalizedApiUrl)),
  };
}

function normalizeComponent(component: PageResponse['components'][number], apiUrl: string): PageResponse['components'][number] {
  return {
    ...component,
    data: normalizeValue(component.data, apiUrl) as Record<string, unknown>,
    children: component.children?.map((child) => normalizeComponent(child, apiUrl)),
  };
}

function normalizeValue(value: unknown, apiUrl: string): unknown {
  if (typeof value === 'string') {
    if (value.startsWith(AUTHOR_ASSET_PREFIX)) {
      return `${apiUrl}${value}`;
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item, apiUrl));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, normalizeValue(nested, apiUrl)]),
    );
  }

  return value;
}
