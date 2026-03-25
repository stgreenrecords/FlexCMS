/**
 * flexcms/shared-footer — site-wide footer component.
 *
 * Data contract:
 *   - copyright?: string  — e.g. "© 2024 Acme Corp"
 *   - links?: Array<{ label: string; href: string }>
 */
import { Component, Input } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import type { ComponentNode } from '@flexcms/sdk';
import type { FlexCmsComponent } from '@flexcms/angular';

@Component({
  selector: 'app-shared-footer',
  standalone: true,
  imports: [NgFor, NgIf],
  template: `
    <footer style="border-top:1px solid #e5e7eb;padding:2rem;text-align:center;background:#f9fafb;">
      <div *ngIf="data['links']" style="display:flex;gap:1.5rem;justify-content:center;margin-bottom:1rem;flex-wrap:wrap;">
        <a
          *ngFor="let link of links"
          [href]="link.href"
          style="font-size:0.875rem;color:#6b7280;text-decoration:none;"
        >
          {{ link.label }}
        </a>
      </div>
      <p style="font-size:0.875rem;color:#9ca3af;margin:0;">
        {{ data['copyright'] || ('© ' + year + ' FlexCMS Site') }}
      </p>
    </footer>
  `,
})
export class SharedFooterComponent implements FlexCmsComponent {
  @Input() data: Record<string, unknown> = {};
  @Input() children: ComponentNode[] = [];

  readonly year = new Date().getFullYear();

  get links(): Array<{ label: string; href: string }> {
    return (this.data['links'] as Array<{ label: string; href: string }>) ?? [];
  }
}

