/**
 * FlexCMS Angular Adapter — Core Service
 *
 * Injectable service that provides centralized access to the FlexCmsClient
 * and ComponentMapper within an Angular application.
 *
 * Injected automatically by FlexCmsComponentComponent and FlexCmsPageComponent.
 * Configure via provideFlexCms() in your app config.
 *
 * @example
 * ```typescript
 * @Component({ ... })
 * export class MyComponent {
 *   private cms = inject(FlexCmsService);
 *
 *   loadPage(path: string) {
 *     return this.cms.getPage(path);
 *   }
 * }
 * ```
 */
import { Injectable, inject, type Type } from '@angular/core';
import { from, type Observable } from 'rxjs';
import { FlexCmsClient, ComponentMapper } from '@flexcms/sdk';
import type { PageResponse, NavigationItem } from '@flexcms/sdk';
import { FLEXCMS_CLIENT, FLEXCMS_MAPPER } from './tokens';
import type {
  FlexCmsAngularComponentType,
  FlexCmsAngularComponentFactory,
} from './types';

@Injectable({ providedIn: 'root' })
export class FlexCmsService {
  /** The FlexCMS HTTP client */
  readonly client: FlexCmsClient = inject(FLEXCMS_CLIENT);

  /** Component mapper: resourceType → Angular component type */
  readonly mapper: ComponentMapper<FlexCmsAngularComponentType> = inject(FLEXCMS_MAPPER);

  // ---------------------------------------------------------------------------
  // Page & content helpers (Observable wrappers around the SDK)
  // ---------------------------------------------------------------------------

  /**
   * Fetch a CMS page as an Observable.
   *
   * @example
   * ```typescript
   * this.cms.getPage('/en/homepage').subscribe(page => this.pageData = page);
   * ```
   */
  getPage(
    path: string,
    options?: { site?: string; locale?: string }
  ): Observable<PageResponse> {
    return from(this.client.getPage(path, options));
  }

  /**
   * Fetch navigation as an Observable.
   */
  getNavigation(
    siteId: string,
    locale = 'en',
    depth = 3
  ): Observable<NavigationItem[]> {
    return from(this.client.getNavigation(siteId, locale, depth));
  }

  // ---------------------------------------------------------------------------
  // Component resolution
  // ---------------------------------------------------------------------------

  /**
   * Resolve a CMS resourceType to an Angular component type.
   * Returns `null` if no component is registered for the given type.
   *
   * For lazy-registered components this is synchronous only after the
   * component has been resolved (use `resolveComponent()` instead).
   */
  resolveSync(resourceType: string): FlexCmsAngularComponentType | null {
    return this.mapper.resolve(resourceType) ?? null;
  }

  /**
   * Resolve a CMS resourceType to an Angular component type, supporting
   * both eager and lazy-registered components.
   *
   * @example
   * ```typescript
   * const type = await this.cms.resolveComponent('myapp/hero');
   * ```
   */
  async resolveComponent(
    resourceType: string
  ): Promise<FlexCmsAngularComponentType | null> {
    const entry = this.mapper.resolve(resourceType);
    if (!entry) return null;

    // Already an Angular component class
    if (isComponentType(entry)) {
      return entry;
    }

    // Lazy factory
    const factory = entry as FlexCmsAngularComponentFactory;
    if (typeof factory === 'function') {
      const result = await (factory as () => Promise<any>)();
      // Support both `{ default: ComponentType }` and bare `ComponentType`
      return (result.default ?? result) as FlexCmsAngularComponentType;
    }

    return null;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Duck-type check: is this a concrete Angular component class
 * (has 'ɵcmp' which Angular attaches to decorated component classes)?
 */
function isComponentType(value: unknown): value is Type<unknown> {
  return (
    typeof value === 'function' &&
    ('ɵcmp' in value || 'ngComponentDef' in value)
  );
}

