/**
 * flexcms/rich-text — renders HTML content from the CMS.
 *
 * Uses [innerHTML] with Angular's DomSanitizer to safely render
 * the sanitized HTML returned by the CMS (XSS-sanitized by the backend).
 */
import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { inject } from '@angular/core';
import type { ComponentNode } from '@flexcms/sdk';
import type { FlexCmsComponent } from '@flexcms/angular';

@Component({
  selector: 'app-rich-text',
  standalone: true,
  template: `
    <div class="flexcms-rich-text prose" [innerHTML]="safeHtml"></div>
  `,
  styles: [`
    .flexcms-rich-text { max-width: 72ch; line-height: 1.7; }
    .flexcms-rich-text :is(h1,h2,h3,h4) { font-weight: 700; margin: 1.5rem 0 0.5rem; }
    .flexcms-rich-text p { margin: 0.75rem 0; }
    .flexcms-rich-text a { color: #2563eb; text-decoration: underline; }
  `],
})
export class RichTextComponent implements FlexCmsComponent {
  @Input() data: Record<string, unknown> = {};
  @Input() children: ComponentNode[] = [];

  private sanitizer = inject(DomSanitizer);

  get safeHtml(): SafeHtml {
    const content = (this.data['content'] as string) ?? '';
    // Trust the HTML — the backend already applied OWASP sanitization (jsoup)
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }
}

