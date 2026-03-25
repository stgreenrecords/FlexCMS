/**
 * FlexCMS Angular Adapter — Shared Types
 */
import type { Type } from '@angular/core';
import type { ComponentNode, FlexCmsConfig } from '@flexcms/sdk';

// ---------------------------------------------------------------------------
// Component input contract
// ---------------------------------------------------------------------------

/**
 * Interface that every FlexCMS-rendered Angular component must implement.
 *
 * Components receive `data` (the component's JSON properties from the CMS)
 * and optionally `children` (for container components).
 *
 * @example
 * ```typescript
 * @Component({ selector: 'app-hero', standalone: true, template: '...' })
 * export class HeroComponent implements FlexCmsComponent {
 *   @Input() data: Record<string, unknown> = {};
 *   @Input() children: ComponentNode[] = [];
 * }
 * ```
 */
export interface FlexCmsComponent {
  data: Record<string, unknown>;
  children?: ComponentNode[];
}

/**
 * An eager Angular component type implementing FlexCmsComponent.
 */
export type FlexCmsAngularComponentType = Type<FlexCmsComponent>;

/**
 * A lazy factory that resolves to an Angular component type.
 * Supports standard dynamic-import patterns:
 *   `() => import('./hero.component').then(m => m.HeroComponent)`
 *   `() => import('./hero.component')` (if default export)
 */
export type FlexCmsAngularComponentFactory =
  | FlexCmsAngularComponentType
  | (() => Promise<FlexCmsAngularComponentType>)
  | (() => Promise<{ default: FlexCmsAngularComponentType }>);

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface FlexCmsAngularConfig extends FlexCmsConfig {
  /**
   * Component registry: maps CMS resourceType strings to Angular component
   * types or lazy-load factories.
   *
   * @example
   * ```typescript
   * components: {
   *   'myapp/hero':     HeroComponent,                                          // eager
   *   'myapp/gallery':  () => import('./gallery.component').then(m => m.Gal),  // lazy
   * }
   * ```
   */
  components?: Record<string, FlexCmsAngularComponentFactory>;
}

