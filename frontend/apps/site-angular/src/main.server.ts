/**
 * Server-side entry point for Angular SSR (@angular/ssr).
 *
 * This file is bundled into the server chunk and used by server.ts (Express).
 * It exports `AppServerModule` (or the bootstrap function) so the SSR engine
 * can render the application to HTML on the server.
 */
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appServerConfig } from './app/app.config.server';

/**
 * Default export consumed by @angular/ssr's rendering engine.
 * This is the canonical entry for server-side rendering.
 */
export default bootstrapApplication(AppComponent, appServerConfig);

