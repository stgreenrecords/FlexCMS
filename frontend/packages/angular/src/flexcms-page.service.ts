/**
 * FlexCmsPageService — Signal/Observable-based page state management.
 *
 * Wraps FlexCmsService to provide Angular-idiomatic reactive page fetching
 * with loading/error state — a direct analogue of the React useFlexCmsPage hook.
 *
 * @example
 * ```typescript
 * // Component using Signals (Angular 17+)
 * @Component({
 *   standalone: true,
 *   imports: [FlexCmsPageComponent, NgIf, AsyncPipe],
 *   template: `
 *     <div *ngIf="loading()">Loading…</div>
 *     <div *ngIf="error()">{{ error()!.message }}</div>
 *     <flexcms-page *ngIf="pageData()" [pageData]="pageData()!"></flexcms-page>
 *   `
 * })
 * export class PageComponent implements OnInit {
 *   private pageSvc = inject(FlexCmsPageService);
 *
 *   pageData = this.pageSvc.pageData;
 *   loading  = this.pageSvc.loading;
 *   error    = this.pageSvc.error;
 *
 *   ngOnInit() {
 *     this.pageSvc.load('/en/homepage', { site: 'my-site', locale: 'en' });
 *   }
 * }
 * ```
 */
import { Injectable, inject, signal } from '@angular/core';
import type { PageResponse } from '@flexcms/sdk';
import { FlexCmsService } from './flexcms.service';

export interface PageState {
  pageData: PageResponse | null;
  loading: boolean;
  error: Error | null;
}

@Injectable()
export class FlexCmsPageService {
  private service = inject(FlexCmsService);

  // ---------------------------------------------------------------------------
  // Signals
  // ---------------------------------------------------------------------------

  readonly pageData = signal<PageResponse | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<Error | null>(null);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Fetch a CMS page and update the reactive signals.
   * Call this from ngOnInit or in response to route changes.
   */
  async load(
    path: string,
    options?: { site?: string; locale?: string }
  ): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const page = await this.service.client.getPage(path, options);
      this.pageData.set(page);
    } catch (err) {
      this.error.set(err instanceof Error ? err : new Error(String(err)));
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Reset all state (useful on route changes).
   */
  reset(): void {
    this.pageData.set(null);
    this.loading.set(false);
    this.error.set(null);
  }

  /**
   * Observable-based alternative to load() — integrates with the Angular
   * router's resolve guards or RxJS pipelines.
   *
   * @example
   * ```typescript
   * this.pageSvc.getPage$('/en/homepage').subscribe();
   * ```
   */
  getPage$(
    path: string,
    options?: { site?: string; locale?: string }
  ) {
    return this.service.getPage(path, options);
  }
}

