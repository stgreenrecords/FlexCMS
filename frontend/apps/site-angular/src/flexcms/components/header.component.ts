/**
 * flexcms/shared-header — site-wide navigation header.
 *
 * Rendered at the top of every page via the CMS page template.
 * Navigation items are driven by the CMS content tree structure.
 *
 * Data contract:
 *   - logo?: string        — site name / logo text
 *   - navItems?: Array<{ label: string; href: string }>
 *   - sticky?: boolean
 */
import { Component, Input } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { ComponentNode } from '@flexcms/sdk';
import type { FlexCmsComponent } from '@flexcms/angular';

interface NavItem { label: string; href: string; }

@Component({
  selector: 'app-shared-header',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink],
  template: `
    <header [style]="headerStyle">
      <a routerLink="/" style="font-size:1.25rem;font-weight:800;color:#111;text-decoration:none;">
        {{ data['logo'] || 'FlexCMS Site' }}
      </a>
      <nav style="display:flex;gap:1.5rem;align-items:center;">
        <a
          *ngFor="let item of navItems"
          [routerLink]="item.href"
          style="font-size:0.9375rem;color:#374151;text-decoration:none;font-weight:500;"
        >
          {{ item.label }}
        </a>
      </nav>
    </header>
  `,
})
export class SharedHeaderComponent implements FlexCmsComponent {
  @Input() data: Record<string, unknown> = {};
  @Input() children: ComponentNode[] = [];

  get navItems(): NavItem[] {
    return (this.data['navItems'] as NavItem[]) ?? [];
  }

  get headerStyle(): string {
    const base = 'background:#fff;border-bottom:1px solid #e5e7eb;padding:0 2rem;height:64px;display:flex;align-items:center;justify-content:space-between;';
    return this.data['sticky'] ? base + 'position:sticky;top:0;z-index:50;' : base;
  }
}

