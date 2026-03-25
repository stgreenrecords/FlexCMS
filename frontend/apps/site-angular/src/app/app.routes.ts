/**
 * Application route definitions.
 *
 * The wildcard route `**` catches all URL paths and delegates to
 * CmsPageComponent, which fetches the matching CMS page from the API.
 *
 * Add feature routes (e.g., /account, /cart) BEFORE the wildcard
 * so they are matched first.
 */
import { Routes } from '@angular/router';
import { CmsPageComponent } from './pages/cms-page.component';

export const APP_ROUTES: Routes = [
  // ── Feature routes go here ────────────────────────────────────────────
  // Example:
  // { path: 'account', loadComponent: () => import('./pages/account.component') },

  // ── CMS wildcard — must be LAST ──────────────────────────────────────
  // Matches every URL path and fetches the corresponding CMS page.
  { path: '**', component: CmsPageComponent },
];

