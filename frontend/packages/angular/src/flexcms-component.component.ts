/**
 * FlexCmsComponentComponent — renders a single CMS component node.
 *
 * Resolves the component type from the FlexCmsService mapper using the node's
 * `resourceType`, then dynamically instantiates it via NgComponentOutlet.
 * Container components receive their child nodes and can render them recursively.
 *
 * Supports both eagerly-registered and lazily-loaded component types.
 *
 * @example
 * ```html
 * <flexcms-component [node]="componentNode"></flexcms-component>
 * ```
 */
import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
  isDevMode,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  type Type,
} from '@angular/core';
import { NgComponentOutlet, NgIf, NgFor } from '@angular/common';
import type { ComponentNode } from '@flexcms/sdk';
import { FlexCmsService } from './flexcms.service';
import type { FlexCmsAngularComponentType } from './types';

@Component({
  selector: 'flexcms-component',
  standalone: true,
  imports: [NgComponentOutlet, NgIf, NgFor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Resolved component rendered via NgComponentOutlet -->
    <ng-container *ngIf="resolvedType; else placeholder">
      <ng-container
        *ngComponentOutlet="resolvedType; inputs: componentInputs"
      ></ng-container>
    </ng-container>

    <!-- Dev-mode placeholder for unknown resource types -->
    <ng-template #placeholder>
      <div
        *ngIf="showDevPlaceholder"
        [attr.data-flexcms-missing]="node.resourceType"
        style="border: 2px dashed #ef4444; padding: 1rem; margin: 0.25rem 0; font-family: monospace; font-size: 0.75rem;"
      >
        <strong>FlexCMS: Unknown component</strong> — {{ node.resourceType }}
      </div>
    </ng-template>
  `,
})
export class FlexCmsComponentComponent implements OnChanges {
  /** The CMS component node to render */
  @Input({ required: true }) node!: ComponentNode;

  /** Resolved Angular component type — set async after resource type lookup */
  resolvedType: FlexCmsAngularComponentType | null = null;

  /** Inputs forwarded to the resolved component */
  componentInputs: Record<string, unknown> = {};

  /** Show a dev-mode placeholder when component type is missing */
  get showDevPlaceholder(): boolean {
    return isDevMode() && this.resolvedType === null;
  }

  private service = inject(FlexCmsService);
  private cdr = inject(ChangeDetectorRef);

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['node']) {
      await this.resolveAndMount();
    }
  }

  private async resolveAndMount(): Promise<void> {
    const componentType = await this.service.resolveComponent(this.node.resourceType);

    this.resolvedType = componentType;
    this.componentInputs = {
      data: this.node.data ?? {},
      children: this.node.children ?? [],
    };

    // Trigger change detection after async resolution
    this.cdr.markForCheck();
  }
}

