/**
 * Express SSR server for the FlexCMS Angular reference site.
 *
 * Used in production after `ng build && ng run site-angular:server`.
 * The `@angular/ssr` package generates `dist/site-angular/server/server.mjs`.
 *
 * Environment variables:
 *   PORT                  — HTTP port (default: 3003)
 *   FLEXCMS_API_URL       — FlexCMS backend URL (default: http://localhost:8080)
 *   FLEXCMS_DEFAULT_SITE  — CMS site ID (default: corporate)
 *   FLEXCMS_DEFAULT_LOCALE — Default locale (default: en)
 *
 * Development:
 *   Run `ng serve` for a live-reload dev server (port 3003).
 *
 * Production:
 *   1. ng build
 *   2. ng run site-angular:server
 *   3. node dist/site-angular/server/server.mjs
 */
import 'zone.js/node';

import express from 'express';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';

// The path to the Angular dist folder (populated by ng build)
const DIST_FOLDER = join(process.cwd(), 'dist/site-angular/browser');

// Express application
const app = express();

// ---------------------------------------------------------------------------
// Static assets — serve pre-built browser files directly
// ---------------------------------------------------------------------------
app.use(express.static(DIST_FOLDER, { maxAge: '1y', immutable: true }));

// ---------------------------------------------------------------------------
// SSR — render every other request with Angular
// ---------------------------------------------------------------------------
app.get('*', async (req, res, next) => {
  try {
    // Dynamically import the SSR engine after build
    // (the import path resolves to dist/ after `ng build`)
    const { AppServerModule, renderModule } = await import(
      './dist/site-angular/server/main.server.mjs' as string
    );

    const template = readFileSync(join(DIST_FOLDER, 'index.html'), 'utf-8');

    const html = await renderModule(AppServerModule, {
      document: template,
      url: req.url,
    });

    res.send(html);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const PORT = parseInt(process.env['PORT'] ?? '3003', 10);
app.listen(PORT, () => {
  console.log(`FlexCMS Angular SSR server running at http://localhost:${PORT}`);
  console.log(`  API: ${process.env['FLEXCMS_API_URL'] ?? 'http://localhost:8080'}`);
});

