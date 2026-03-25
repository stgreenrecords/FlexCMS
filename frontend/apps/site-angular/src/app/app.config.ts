/**
 * Client-side application configuration.
 *
 * Provides: Angular Router, FlexCMS client + component registry,
 * animations, HTTP client, and zone-based change detection.
 *
 * Server-specific providers are added in app.config.server.ts.
 */
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideFlexCms } from '@flexcms/angular';
import { APP_ROUTES } from './app.routes';
import { FLEXCMS_COMPONENT_MAP } from '../flexcms/component-map';

export const appConfig: ApplicationConfig = {
  providers: [
    // Angular Router — enables client-side navigation between CMS pages
    provideRouter(APP_ROUTES, withEnabledBlockingInitialNavigation()),

    // Animations (required by some Angular components)
    provideAnimations(),

    // FlexCMS — wires the API client and component registry
    provideFlexCms({
      apiUrl: typeof window !== 'undefined'
        ? (window as any).__FLEXCMS_API_URL__ ?? 'http://localhost:8080'
        : 'http://localhost:8080',
      defaultSite: 'corporate',
      defaultLocale: 'en',
      components: FLEXCMS_COMPONENT_MAP,
    }),
  ],
};

