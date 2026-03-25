/**
 * Server-side application configuration.
 *
 * Merges the client config with SSR-specific providers:
 * - `provideServerRendering()` enables Angular's SSR pipeline
 * - Server-side API URL comes from the NODE environment variable
 *   (no `window` object is available on the server)
 */
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideFlexCms } from '@flexcms/angular';
import { appConfig } from './app.config';
import { APP_ROUTES } from './app.routes';
import { FLEXCMS_COMPONENT_MAP } from '../flexcms/component-map';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';

const serverSpecificConfig: ApplicationConfig = {
  providers: [
    // Enables Angular SSR
    provideServerRendering(),

    // Override FlexCMS config for the server side — use env var, not window object
    provideFlexCms({
      apiUrl: process.env['FLEXCMS_API_URL'] ?? 'http://localhost:8080',
      defaultSite: process.env['FLEXCMS_DEFAULT_SITE'] ?? 'corporate',
      defaultLocale: process.env['FLEXCMS_DEFAULT_LOCALE'] ?? 'en',
      components: FLEXCMS_COMPONENT_MAP,
    }),

    // Re-provide router with SSR-compatible initial navigation
    provideRouter(APP_ROUTES, withEnabledBlockingInitialNavigation()),
  ],
};

export const appServerConfig: ApplicationConfig = mergeApplicationConfig(
  appConfig,
  serverSpecificConfig
);

