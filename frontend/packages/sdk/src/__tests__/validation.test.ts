import { describe, it, expect } from 'vitest';
import {
  FlexCmsConfigSchema,
  SearchOptionsSchema,
  SearchQuerySchema,
  PageFetchOptionsSchema,
  NavigationOptionsSchema,
  ContentPathSchema,
  SiteIdSchema,
  LocaleSchema,
} from '../validation';

// ---------------------------------------------------------------------------
// FlexCmsConfigSchema
// ---------------------------------------------------------------------------

describe('FlexCmsConfigSchema', () => {
  it('parses valid config with only apiUrl', () => {
    const result = FlexCmsConfigSchema.parse({ apiUrl: 'https://api.example.com' });
    expect(result.apiUrl).toBe('https://api.example.com');
  });

  it('parses valid config with all optional fields', () => {
    const result = FlexCmsConfigSchema.parse({
      apiUrl: 'https://api.example.com',
      defaultSite: 'corporate',
      defaultLocale: 'en',
      headers: { 'X-API-Key': 'secret' },
    });
    expect(result.defaultSite).toBe('corporate');
    expect(result.defaultLocale).toBe('en');
    expect(result.headers?.['X-API-Key']).toBe('secret');
  });

  it('fails when apiUrl is missing', () => {
    expect(() => FlexCmsConfigSchema.parse({})).toThrow();
  });

  it('fails when apiUrl is empty string', () => {
    expect(() => FlexCmsConfigSchema.parse({ apiUrl: '' })).toThrow();
  });

  it('fails when defaultSite is empty string', () => {
    expect(() =>
      FlexCmsConfigSchema.parse({ apiUrl: 'https://api.example.com', defaultSite: '' })
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// SearchOptionsSchema
// ---------------------------------------------------------------------------

describe('SearchOptionsSchema', () => {
  it('parses empty object (all optional)', () => {
    const result = SearchOptionsSchema.parse({});
    expect(result).toEqual({});
  });

  it('parses valid options', () => {
    const result = SearchOptionsSchema.parse({ site: 'corp', locale: 'en', page: 0, size: 20 });
    expect(result.site).toBe('corp');
    expect(result.page).toBe(0);
    expect(result.size).toBe(20);
  });

  it('fails when page is negative', () => {
    expect(() => SearchOptionsSchema.parse({ page: -1 })).toThrow();
  });

  it('fails when size is 0', () => {
    expect(() => SearchOptionsSchema.parse({ size: 0 })).toThrow();
  });

  it('fails when size exceeds 100', () => {
    expect(() => SearchOptionsSchema.parse({ size: 101 })).toThrow();
  });

  it('accepts size of exactly 100', () => {
    const result = SearchOptionsSchema.parse({ size: 100 });
    expect(result.size).toBe(100);
  });

  it('accepts size of 1', () => {
    const result = SearchOptionsSchema.parse({ size: 1 });
    expect(result.size).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// SearchQuerySchema
// ---------------------------------------------------------------------------

describe('SearchQuerySchema', () => {
  it('parses valid query', () => {
    expect(SearchQuerySchema.parse('hello world')).toBe('hello world');
  });

  it('fails for empty string', () => {
    expect(() => SearchQuerySchema.parse('')).toThrow();
  });

  it('fails for string longer than 500 characters', () => {
    expect(() => SearchQuerySchema.parse('a'.repeat(501))).toThrow();
  });

  it('accepts string of exactly 500 characters', () => {
    expect(SearchQuerySchema.parse('a'.repeat(500))).toHaveLength(500);
  });
});

// ---------------------------------------------------------------------------
// PageFetchOptionsSchema
// ---------------------------------------------------------------------------

describe('PageFetchOptionsSchema', () => {
  it('parses empty options', () => {
    expect(PageFetchOptionsSchema.parse({})).toEqual({});
  });

  it('parses valid site and locale', () => {
    const result = PageFetchOptionsSchema.parse({ site: 'corp', locale: 'en' });
    expect(result.site).toBe('corp');
    expect(result.locale).toBe('en');
  });
});

// ---------------------------------------------------------------------------
// NavigationOptionsSchema
// ---------------------------------------------------------------------------

describe('NavigationOptionsSchema', () => {
  it('defaults depth to 3', () => {
    const result = NavigationOptionsSchema.parse({});
    expect(result.depth).toBe(3);
  });

  it('accepts valid depth', () => {
    expect(NavigationOptionsSchema.parse({ depth: 5 }).depth).toBe(5);
  });

  it('fails when depth is 0', () => {
    expect(() => NavigationOptionsSchema.parse({ depth: 0 })).toThrow();
  });

  it('fails when depth exceeds 10', () => {
    expect(() => NavigationOptionsSchema.parse({ depth: 11 })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// ContentPathSchema
// ---------------------------------------------------------------------------

describe('ContentPathSchema', () => {
  it('accepts valid path with slashes', () => {
    expect(ContentPathSchema.parse('/content/corporate/en')).toBe('/content/corporate/en');
  });

  it('accepts alphanumeric paths with hyphens and underscores', () => {
    expect(ContentPathSchema.parse('my-page_v2/section')).toBe('my-page_v2/section');
  });

  it('fails for empty string', () => {
    expect(() => ContentPathSchema.parse('')).toThrow();
  });

  it('fails when path contains special characters', () => {
    expect(() => ContentPathSchema.parse('/content/page?id=1')).toThrow();
    expect(() => ContentPathSchema.parse('/content/page#section')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// SiteIdSchema
// ---------------------------------------------------------------------------

describe('SiteIdSchema', () => {
  it('accepts valid lowercase site ID', () => {
    expect(SiteIdSchema.parse('corporate')).toBe('corporate');
    expect(SiteIdSchema.parse('my-brand-01')).toBe('my-brand-01');
  });

  it('fails for empty string', () => {
    expect(() => SiteIdSchema.parse('')).toThrow();
  });

  it('fails for uppercase characters', () => {
    expect(() => SiteIdSchema.parse('Corporate')).toThrow();
  });

  it('fails for underscores', () => {
    expect(() => SiteIdSchema.parse('my_brand')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// LocaleSchema
// ---------------------------------------------------------------------------

describe('LocaleSchema', () => {
  it('accepts two-letter language code', () => {
    expect(LocaleSchema.parse('en')).toBe('en');
    expect(LocaleSchema.parse('de')).toBe('de');
  });

  it('accepts language-region format', () => {
    expect(LocaleSchema.parse('en-US')).toBe('en-US');
    expect(LocaleSchema.parse('de-DE')).toBe('de-DE');
  });

  it('fails for single character', () => {
    expect(() => LocaleSchema.parse('e')).toThrow();
  });

  it('fails for uppercase language code', () => {
    expect(() => LocaleSchema.parse('EN')).toThrow();
  });

  it('fails for lowercase region', () => {
    expect(() => LocaleSchema.parse('en-us')).toThrow();
  });
});
