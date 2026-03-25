/**
 * Client-side bootstrap for the FlexCMS Angular reference site.
 *
 * This file is the entry point for the browser bundle.
 * The server-side entry is main.server.ts.
 */
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error('Bootstrap error:', err)
);

