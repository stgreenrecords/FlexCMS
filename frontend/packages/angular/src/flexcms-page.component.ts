/**
 * FlexCmsPageComponent — renders a full CMS page.
 *
 * Iterates the page's top-level component array and renders each node
 * using FlexCmsComponentComponent.
 *
 * @example
 * ```typescript
 * // Angular SSR route (app-shell or server component)
 * @Component({
 *   standalone: true,
 *   imports: [FlexCmsPageComponent, AsyncPipe],
 *   template: `
 *     <flexcms-page
 *       *ngIf="pageData$ | async as pageData"
 *       [pageData]="pageData"
 *     ></flexcms-page>
 *   `
 * })
 * export class PageRouteComponent {
 *   pageData$ = inject(FlexCmsService).getPage('/en/homepage');
 * }
 * ```
 */
import {
  Component,
  Input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import type { PageResponse } from '@flexcms/sdk';
import { FlexCmsComponentComponent } from './flexcms-component.component';

@Component({
  selector: 'flexcms-page',
  standalone: true,
  imports: [NgFor, NgIf, FlexCmsComponentComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      *ngIf="pageData"
      class="flexcms-page"
      [attr.data-flexcms-page]="pageData.page.path"
    >
      <flexcms-component
        *ngFor="let node of pageData.components; trackBy: trackByName"
        [node]="node"
      ></flexcms-component>
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .flexcms-page { display: contents; }
    `,
  ],
})
export class FlexCmsPageComponent {
  /** Pre-fetched page data from the FlexCMS API */
  @Input({ required: true }) pageData!: PageResponse;

  trackByName(_index: number, node: { name: string }): string {
    return node.name;
  }
}

