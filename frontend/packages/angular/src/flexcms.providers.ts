/**
 * FlexCMS Angular Adapter — Environment Providers
 *
 * Call provideFlexCms() in your app.config.ts (or module providers) to
 * bootstrap the FlexCMS client and component registry.
 *
 * @example
 * ```typescript
 * // app.config.ts
 * import { ApplicationConfig } from '@angular/core';
 * import { provideFlexCms } from '@flexcms/angular';
 * import { HeroComponent } from './components/hero.component';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideFlexCms({
 *       apiUrl: 'https://api.example.com',
 *       components: {
 *         'myapp/hero':    HeroComponent,
 *         'myapp/gallery': () => import('./components/gallery.component')
 *                               .then(m => m.GalleryComponent),
 *       },
 *     }),
 *   ],
 * };
 * ```
 */
import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { FlexCmsClient, ComponentMapper } from '@flexcms/sdk';
import { FLEXCMS_CLIENT, FLEXCMS_MAPPER } from './tokens';
import type { FlexCmsAngularConfig, FlexCmsAngularComponentType } from './types';

/**
 * Returns Angular environment providers for FlexCMS.
 * Add to `providers` in `app.config.ts` or `bootstrapApplication()`.
 */
export function provideFlexCms(config: FlexCmsAngularConfig): EnvironmentProviders {
  const client = new FlexCmsClient(config);
  const mapper = new ComponentMapper<FlexCmsAngularComponentType>();

  if (config.components) {
    for (const [resourceType, factory] of Object.entries(config.components)) {
      // ComponentMapper.register accepts any value — we store factories as-is
      // and resolve them lazily in FlexCmsService.resolveComponent()
      mapper.register(resourceType, factory as FlexCmsAngularComponentType);
    }
  }

  return makeEnvironmentProviders([
    { provide: FLEXCMS_CLIENT, useValue: client },
    { provide: FLEXCMS_MAPPER, useValue: mapper },
  ]);
}

