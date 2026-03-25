/**
 * flexcms/hero — full-width hero banner.
 *
 * Data contract:
 *   - headline: string     — primary heading text
 *   - subtext?: string     — supporting paragraph
 *   - backgroundImage?: string — CSS background-image URL
 *   - ctaLabel?: string    — primary CTA button label
 *   - ctaHref?: string     — primary CTA link target
 *   - ctaStyle?: 'primary' | 'outline'
 *   - textAlign?: 'left' | 'center' | 'right'
 */
import { Component, Input } from '@angular/core';
import { NgIf, NgStyle } from '@angular/common';
import type { ComponentNode } from '@flexcms/sdk';
import type { FlexCmsComponent } from '@flexcms/angular';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [NgIf, NgStyle],
  template: `
    <section
      class="flexcms-hero"
      [ngStyle]="sectionStyles"
      style="
        padding: 6rem 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        min-height: 480px;
      "
    >
      <!-- Background overlay -->
      <div *ngIf="data['backgroundImage']" style="position:absolute;inset:0;background:rgba(0,0,0,0.45);"></div>

      <div
        style="position:relative;z-index:1;max-width:800px;width:100%;"
        [style.textAlign]="textAlign"
      >
        <h1 style="font-size:clamp(2rem,5vw,3.5rem);font-weight:800;line-height:1.15;margin:0 0 1rem;">
          {{ data['headline'] }}
        </h1>
        <p *ngIf="data['subtext']" style="font-size:1.125rem;line-height:1.6;margin:0 0 2rem;opacity:0.9;">
          {{ data['subtext'] }}
        </p>
        <a
          *ngIf="data['ctaLabel']"
          [href]="data['ctaHref'] || '/'"
          [style]="ctaStyle"
        >
          {{ data['ctaLabel'] }}
        </a>
      </div>
    </section>
  `,
})
export class HeroComponent implements FlexCmsComponent {
  @Input() data: Record<string, unknown> = {};
  @Input() children: ComponentNode[] = [];

  get textAlign(): string {
    return (this.data['textAlign'] as string) ?? 'center';
  }

  get sectionStyles(): Record<string, string> {
    const bg = this.data['backgroundImage'] as string | undefined;
    return bg
      ? { backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { backgroundColor: '#1a1a2e' };
  }

  get ctaStyle(): string {
    const variant = (this.data['ctaStyle'] as string) ?? 'primary';
    const base = 'display:inline-block;padding:0.875rem 2rem;border-radius:0.375rem;font-weight:600;font-size:1rem;text-decoration:none;transition:opacity .2s;';
    return variant === 'outline'
      ? base + 'border:2px solid #fff;color:#fff;'
      : base + 'background:#2563eb;color:#fff;';
  }
}

