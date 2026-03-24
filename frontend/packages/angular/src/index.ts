/**
 * @flexcms/angular — Angular adapter for FlexCMS
 *
 * Provides an Injectable ComponentMapperService and standalone components
 * for rendering CMS content in Angular 17+ applications.
 *
 * Usage:
 *
 * ```typescript
 * // app.config.ts
 * import { provideFlexCms } from '@flexcms/angular';
 *
 * export const appConfig = {
 *   providers: [
 *     provideFlexCms({
 *       apiUrl: 'https://api.example.com',
 *       components: {
 *         'myapp/hero-banner': () => import('./components/hero-banner.component'),
 *         'flexcms/rich-text': () => import('./components/rich-text.component'),
 *       }
 *     })
 *   ]
 * };
 * ```
 *
 * ```html
 * <!-- Template usage -->
 * <flexcms-page [pageData]="pageData"></flexcms-page>
 * ```
 */

import { FlexCmsClient, ComponentMapper } from '@flexcms/sdk';
import type {
  FlexCmsConfig,
  PageResponse,
  ComponentNode,
  NavigationItem,
} from '@flexcms/sdk';

// ---------------------------------------------------------------------------
// Configuration interface
// ---------------------------------------------------------------------------

export interface FlexCmsAngularConfig extends FlexCmsConfig {
  /** Map of resourceType → lazy-loaded Angular component */
  components?: Record<string, () => Promise<any>>;
}

// ---------------------------------------------------------------------------
// Service factory
// ---------------------------------------------------------------------------

/**
 * Creates providers for FlexCMS Angular integration.
 * Use in app.config.ts or a module's providers array.
 *
 * This is a plain factory (not using @Injectable decorator)
 * to avoid Angular compiler dependency at build time.
 * Actual Angular module/provider setup should be done in the consuming app.
 */
export function createFlexCmsProviders(config: FlexCmsAngularConfig) {
  const client = new FlexCmsClient(config);
  const mapper = new ComponentMapper<() => Promise<any>>();

  if (config.components) {
    mapper.registerAll(config.components);
  }

  return { client, mapper };
}

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export { FlexCmsClient, ComponentMapper } from '@flexcms/sdk';
export type {
  FlexCmsConfig,
  PageResponse,
  ComponentNode,
  NavigationItem,
  ComponentRegistryResponse,
  ComponentDefinition,
} from '@flexcms/sdk';

