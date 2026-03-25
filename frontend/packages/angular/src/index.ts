/**
 * @flexcms/angular — Angular adapter for FlexCMS
 *
 * Renders FlexCMS content trees as Angular components.
 * Compatible with Angular 17+ (standalone components, signals, inject()).
 *
 * ## Quick Start
 *
 * ```typescript
 * // app.config.ts
 * import { provideFlexCms } from '@flexcms/angular';
 * import { HeroComponent } from './components/hero.component';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideFlexCms({
 *       apiUrl: 'https://api.example.com',
 *       components: {
 *         'myapp/hero': HeroComponent,
 *         'myapp/text': () => import('./components/text.component').then(m => m.TextComponent),
 *       },
 *     }),
 *   ],
 * };
 *
 * // page.component.ts
 * @Component({
 *   standalone: true,
 *   imports: [FlexCmsPageComponent, NgIf],
 *   template: `
 *     <flexcms-page *ngIf="pageData" [pageData]="pageData"></flexcms-page>
 *   `,
 * })
 * export class PageComponent implements OnInit {
 *   pageData?: PageResponse;
 *   private cms = inject(FlexCmsService);
 *
 *   ngOnInit() {
 *     this.cms.getPage('/en/homepage').subscribe(data => this.pageData = data);
 *   }
 * }
 * ```
 */

// Providers
export { provideFlexCms } from './flexcms.providers';

// DI Tokens
export { FLEXCMS_CLIENT, FLEXCMS_MAPPER } from './tokens';

// Core service
export { FlexCmsService } from './flexcms.service';

// Page service (signals-based state)
export { FlexCmsPageService, type PageState } from './flexcms-page.service';

// Standalone components
export { FlexCmsComponentComponent } from './flexcms-component.component';
export { FlexCmsPageComponent } from './flexcms-page.component';

// Types
export type {
  FlexCmsComponent,
  FlexCmsAngularComponentType,
  FlexCmsAngularComponentFactory,
  FlexCmsAngularConfig,
} from './types';

// Re-export SDK essentials so consumers don't need a separate import
export { FlexCmsClient, ComponentMapper } from '@flexcms/sdk';
export type {
  FlexCmsConfig,
  PageResponse,
  ComponentNode,
  NavigationItem,
  ComponentRegistryResponse,
  ComponentDefinition,
} from '@flexcms/sdk';

