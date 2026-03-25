/**
 * FlexCMS component map for the Angular reference site.
 *
 * Maps CMS `resourceType` strings → Angular component classes.
 * Add new component renderers here as the site grows.
 *
 * Both eager (imported directly) and lazy (dynamic import) components work:
 *
 *   Eager:  'myapp/hero': HeroComponent
 *   Lazy:   'myapp/gallery': () => import('./components/gallery.component')
 *                                  .then(m => m.GalleryComponent)
 *
 * The backend team defines the dialog schema and data contract.
 * The frontend team builds the renderer (this file). Neither side touches
 * the other's code — this file is the only integration point.
 */
import type { FlexCmsAngularComponentFactory } from '@flexcms/angular';
import { RichTextComponent } from './components/rich-text.component';
import { ImageComponent } from './components/image.component';
import { HeroComponent } from './components/hero.component';
import { ContainerComponent } from './components/container.component';
import { SharedHeaderComponent } from './components/header.component';
import { SharedFooterComponent } from './components/footer.component';

/**
 * The component registry — passed to provideFlexCms() in app.config.ts.
 */
export const FLEXCMS_COMPONENT_MAP: Record<string, FlexCmsAngularComponentFactory> = {
  // ── Core content components ───────────────────────────────────────────
  'flexcms/rich-text': RichTextComponent,
  'flexcms/image':     ImageComponent,

  // ── Layout ────────────────────────────────────────────────────────────
  'flexcms/container': ContainerComponent,

  // ── Hero / marketing ──────────────────────────────────────────────────
  'flexcms/hero': HeroComponent,

  // ── Shared site chrome (header/footer) ────────────────────────────────
  'flexcms/shared-header': SharedHeaderComponent,
  'flexcms/shared-footer': SharedFooterComponent,

  // ── Add custom components below ───────────────────────────────────────
  // Example (eager):
  //   'myapp/product-card': ProductCardComponent,
  //
  // Example (lazy — code splits the component into a separate chunk):
  //   'myapp/heavy-chart': () =>
  //     import('./components/chart.component').then(m => m.ChartComponent),
};

