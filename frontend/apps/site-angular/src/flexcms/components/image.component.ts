/**
 * flexcms/image — renders a responsive image from the DAM.
 *
 * Data contract (from CMS dialog):
 *   - src: string        — DAM rendition URL or absolute URL
 *   - alt: string        — accessibility alt text
 *   - width?: number     — intrinsic width (for CLS prevention)
 *   - height?: number    — intrinsic height
 *   - caption?: string   — optional figure caption
 */
import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import type { ComponentNode } from '@flexcms/sdk';
import type { FlexCmsComponent } from '@flexcms/angular';

@Component({
  selector: 'app-flexcms-image',
  standalone: true,
  imports: [NgIf],
  template: `
    <figure class="flexcms-image">
      <img
        [src]="data['src']"
        [attr.alt]="data['alt'] || ''"
        [attr.width]="data['width'] || null"
        [attr.height]="data['height'] || null"
        loading="lazy"
        decoding="async"
        style="max-width:100%;height:auto;"
      />
      <figcaption *ngIf="data['caption']" style="font-size:0.875rem;color:#666;margin-top:0.5rem;">
        {{ data['caption'] }}
      </figcaption>
    </figure>
  `,
})
export class ImageComponent implements FlexCmsComponent {
  @Input() data: Record<string, unknown> = {};
  @Input() children: ComponentNode[] = [];
}

