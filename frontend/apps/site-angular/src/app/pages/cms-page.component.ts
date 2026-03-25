/**
 * CmsPageComponent — catch-all route component that fetches and renders
 * any CMS page by its URL path.
 *
 * This is the Angular equivalent of the Next.js [[...slug]]/page.tsx.
 *
 * SSR flow:
 *   1. Angular SSR calls this component on the server for every request.
 *   2. `ngOnInit` reads the current URL path from ActivatedRoute.
 *   3. FlexCmsPageService.load() fetches the page JSON from the CMS API.
 *   4. @angular/ssr waits for Signals/Observables to settle before serialising.
 *   5. The pre-rendered HTML is sent to the browser.
 *   6. Angular hydrates on the client.
 *
 * Client-side navigation:
 *   Angular Router intercepts link clicks, re-triggers `ngOnInit` with the
 *   new URL (via the ActivatedRoute subscription), and updates the signals.
 */
import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  effect,
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import {
  FlexCmsPageComponent,
  FlexCmsPageService,
} from '@flexcms/angular';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-cms-page',
  standalone: true,
  imports: [NgIf, FlexCmsPageComponent],
  providers: [FlexCmsPageService], // stateful per-route instance
  template: `
    <!-- Loading state -->
    <div *ngIf="pageService.loading()" aria-busy="true" style="min-height:100vh;display:flex;align-items:center;justify-content:center;">
      <p style="color:#666;font-size:1rem;">Loading…</p>
    </div>

    <!-- Error / 404 state -->
    <div *ngIf="pageService.error() && !pageService.loading()" style="min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:1rem;">
      <h1 style="font-size:2rem;font-weight:800;">Page not found</h1>
      <p style="color:#666;">{{ pageService.error()?.message }}</p>
      <a href="/" style="color:blue;text-decoration:underline;">Return home</a>
    </div>

    <!-- Rendered CMS page -->
    <flexcms-page
      *ngIf="pageService.pageData() && !pageService.loading()"
      [pageData]="pageService.pageData()!"
    ></flexcms-page>
  `,
})
export class CmsPageComponent implements OnInit, OnDestroy {
  readonly pageService = inject(FlexCmsPageService);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private routerSub?: Subscription;

  ngOnInit(): void {
    // Load initial page
    this.loadCurrentPage();

    // Re-load on client-side navigation
    this.routerSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.loadCurrentPage());
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.pageService.reset();
  }

  private loadCurrentPage(): void {
    // Reconstruct the CMS path from the current URL
    const urlPath = this.router.url.split('?')[0] || '/';
    const cmsPath = urlPath === '/' ? '/homepage' : urlPath;

    this.pageService.load(cmsPath, {
      site: this.getSiteFromQuery(),
      locale: this.getLocaleFromQuery(),
    });
  }

  private getSiteFromQuery(): string | undefined {
    const val = this.route.snapshot.queryParams['site'];
    return typeof val === 'string' ? val : undefined;
  }

  private getLocaleFromQuery(): string | undefined {
    const val = this.route.snapshot.queryParams['locale'];
    return typeof val === 'string' ? val : undefined;
  }
}

