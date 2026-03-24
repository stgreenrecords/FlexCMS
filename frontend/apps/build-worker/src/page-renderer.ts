/**
 * PageRenderer — Renders CMS pages to static HTML using React SSR.
 *
 * Uses @flexcms/sdk to fetch page JSON and @flexcms/react to render
 * the component tree to an HTML string. Wraps output in a full HTML document.
 */
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { FlexCmsClient, type PageResponse, type ComponentNode } from '@flexcms/sdk';
import { FlexCmsProvider, FlexCmsPage, type FlexCmsRenderer } from '@flexcms/react';
import { ComponentMapper } from '@flexcms/sdk';
import type { BuildWorkerConfig } from './index';
import { createLogger } from './logger';

const log = createLogger('page-renderer');

export interface RenderResult {
  pagePath: string;
  html: string;
  contentVersion: string;
  hash: string;
  dependencies: DependencyEntry[];
}

export interface DependencyEntry {
  type: 'COMPONENT' | 'ASSET' | 'NAVIGATION';
  key: string;
}

export class PageRenderer {
  private client: FlexCmsClient;
  /**
   * The component map used for rendering.
   * In production, this would be loaded from the site's compiled frontend bundle.
   * For now, we use a fallback renderer that outputs the component data as HTML.
   */
  private componentMap: ComponentMapper<FlexCmsRenderer>;

  constructor(private config: BuildWorkerConfig) {
    this.client = new FlexCmsClient({ apiUrl: config.cmsApiUrl });
    this.componentMap = new ComponentMapper<FlexCmsRenderer>();

    // Default fallback: render component data as a <div> with data attributes
    this.componentMap.setFallback(({ data, children }: any) =>
      React.createElement(
        'div',
        { 'data-component': 'true' },
        ...(children ? [children] : []),
        data?.content ? React.createElement('div', { dangerouslySetInnerHTML: { __html: data.content as string } }) : null
      )
    );
  }

  /**
   * Load a site's component map from its compiled frontend.
   * This allows different sites to use different component renderers.
   */
  async loadSiteComponentMap(_siteId: string): Promise<void> {
    // TODO: Dynamically import the site's component-map module
    // For now, using the fallback renderer
  }

  /**
   * Render a batch of pages with bounded concurrency.
   */
  async renderBatch(
    pagePaths: string[],
    siteId: string,
    locale: string,
    concurrency: number
  ): Promise<RenderResult[]> {
    const results: RenderResult[] = [];
    const queue = [...pagePaths];

    const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
      while (queue.length > 0) {
        const path = queue.shift()!;
        try {
          const result = await this.renderPage(path, siteId, locale);
          results.push(result);
        } catch (err) {
          log.error({ err, path, siteId }, 'Failed to render page');
        }
      }
    });

    await Promise.all(workers);
    return results;
  }

  /**
   * Render a single page to static HTML.
   */
  async renderPage(pagePath: string, siteId: string, locale: string): Promise<RenderResult> {
    // 1. Fetch page JSON from FlexCMS API
    const pageData = await this.client.getPage(pagePath, { site: siteId, locale });

    // 2. Collect dependencies from the component tree
    const dependencies = this.collectDependencies(pageData);

    // 3. Render React component tree to HTML string
    const bodyHtml = ReactDOMServer.renderToString(
      React.createElement(
        FlexCmsProvider,
        { client: this.client, componentMap: this.componentMap },
        React.createElement(FlexCmsPage, { pageData })
      )
    );

    // 4. Wrap in full HTML document
    const fullHtml = this.wrapInDocument(bodyHtml, pageData, siteId, locale);

    // 5. Compute content hash for cache busting
    const hash = this.simpleHash(fullHtml);

    return {
      pagePath,
      html: fullHtml,
      contentVersion: pageData.page.lastModified,
      hash,
      dependencies,
    };
  }

  /**
   * Wrap rendered body HTML in a full HTML document.
   */
  private wrapInDocument(body: string, pageData: PageResponse, siteId: string, locale: string): string {
    const { page } = pageData;
    return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(page.title)}</title>
  <meta name="description" content="${this.escapeHtml(page.description ?? '')}">
  <meta name="generator" content="FlexCMS Static Build">
  <meta name="flexcms:site" content="${siteId}">
  <meta name="flexcms:locale" content="${locale}">
  <meta name="flexcms:path" content="${page.path}">
  <meta name="flexcms:version" content="${page.lastModified}">
</head>
<body>
  <div id="__flexcms">${body}</div>
</body>
</html>`;
  }

  /**
   * Walk the component tree and collect dependency entries.
   */
  private collectDependencies(pageData: PageResponse): DependencyEntry[] {
    const deps: DependencyEntry[] = [];
    deps.push({ type: 'NAVIGATION', key: 'nav' }); // All pages depend on nav

    const walk = (components: ComponentNode[]) => {
      for (const c of components) {
        deps.push({ type: 'COMPONENT', key: c.resourceType });

        // Check for asset references in data
        for (const [, value] of Object.entries(c.data)) {
          if (typeof value === 'string' && (value.startsWith('/dam/') || value.startsWith('dam/'))) {
            deps.push({ type: 'ASSET', key: value });
          }
        }

        if (c.children) walk(c.children);
      }
    };

    walk(pageData.components);
    return deps;
  }

  private escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}

