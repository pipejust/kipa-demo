import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

/**
 * K!dS brand logo. Uses the official brand SVG from
 * `public/assets/branding/logos/`.
 *
 * Variants:
 *  - 'horizontal' (default): colorful mark + K!dS wordmark in one line
 *  - 'mark': stacked mark + K!dS (square-ish)
 *  - 'full': full lockup with subtitle (very wide)
 */
@Component({
  selector: 'kipa-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <img
      class="kids-brand"
      [class.kids-brand--horizontal]="variant === 'horizontal'"
      [class.kids-brand--mark]="variant === 'mark'"
      [class.kids-brand--full]="variant === 'full'"
      [src]="src"
      [style.height.px]="size"
      alt="K!dS"
      draggable="false"
    />
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        line-height: 0;
      }
      .kids-brand {
        display: block;
        width: auto;
        max-width: 100%;
        height: auto;
        user-select: none;
        -webkit-user-drag: none;
      }
    `,
  ],
})
export class KipaLogoComponent {
  /** Logo height in pixels. Width auto-scales. Default 36. */
  @Input() size = 36;

  /** Layout variant. */
  @Input() variant: 'horizontal' | 'mark' | 'full' = 'horizontal';

  protected get src(): string {
    switch (this.variant) {
      case 'mark':
        return 'assets/branding/logos/kids-logo-mark.svg';
      case 'full':
        return 'assets/branding/logos/kids-logo-full.svg';
      case 'horizontal':
      default:
        return 'assets/branding/logos/kids-logo-horizontal.svg';
    }
  }
}
