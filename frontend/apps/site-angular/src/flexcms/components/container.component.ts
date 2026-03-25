/**
 * flexcms/container — generic layout container.
 *
 * Renders child CMS components in a configurable grid or flex layout.
 * This is a **container component**: FlexCmsComponentComponent passes
 * `children` (child ComponentNodes) as an input — the container renders
 * them using <flexcms-component> for each child.
 *
 * Data contract:
 *   - layout: 'single' | 'two-equal' | 'three-equal' | 'sidebar-left' | 'sidebar-right'
 *   - gap?: string   — CSS gap value (default: '1.5rem')
 *   - padding?: string — CSS padding value
 */
import { Component, Input } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import type { ComponentNode } from '@flexcms/sdk';
import type { FlexCmsComponent } from '@flexcms/angular';
import { FlexCmsComponentComponent } from '@flexcms/angular';

@Component({
  selector: 'app-container',
  standalone: true,
  imports: [NgFor, NgIf, FlexCmsComponentComponent],
  template: `
    <div class="flexcms-container" [style]="containerStyle">
      <flexcms-component
        *ngFor="let child of children; trackBy: trackByName"
        [node]="child"
      ></flexcms-component>
    </div>
  `,
})
export class ContainerComponent implements FlexCmsComponent {
  @Input() data: Record<string, unknown> = {};
  @Input() children: ComponentNode[] = [];

  get containerStyle(): string {
    const layout = (this.data['layout'] as string) ?? 'single';
    const gap = (this.data['gap'] as string) ?? '1.5rem';
    const padding = (this.data['padding'] as string) ?? '0';

    const gridLayouts: Record<string, string> = {
      'two-equal':    `display:grid;grid-template-columns:1fr 1fr;gap:${gap};padding:${padding};`,
      'three-equal':  `display:grid;grid-template-columns:1fr 1fr 1fr;gap:${gap};padding:${padding};`,
      'sidebar-left': `display:grid;grid-template-columns:280px 1fr;gap:${gap};padding:${padding};`,
      'sidebar-right':`display:grid;grid-template-columns:1fr 280px;gap:${gap};padding:${padding};`,
      'single':       `display:block;padding:${padding};`,
    };

    return gridLayouts[layout] ?? gridLayouts['single'];
  }

  trackByName(_index: number, node: ComponentNode): string {
    return node.name;
  }
}

