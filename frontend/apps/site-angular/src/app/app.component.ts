/**
 * Root application component.
 *
 * Acts as the shell — only renders `<router-outlet>` so that Angular Router
 * can replace its content with the active route's component.
 *
 * Site-wide chrome (header, footer) that appears on every page should be
 * registered as `flexcms/shared-header` / `flexcms/shared-footer` in the
 * component map so the CMS controls their content.
 */
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
})
export class AppComponent {}

