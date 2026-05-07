import { Component, HostBinding, Input, inject, signal, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { LucideAngularModule, Globe } from 'lucide-angular';

interface LangOption {
  code: string;
  codeDisplay: string;
  label: string;
}

@Component({
  selector: 'kipa-lang-switcher',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="lang-switcher" [class.lang-switcher--open]="open()">
      <button
        type="button"
        class="lang-switcher__trigger"
        (click)="toggle($event)"
        [attr.aria-expanded]="open()"
        aria-haspopup="listbox"
      >
        <lucide-icon [img]="Globe" [size]="18" class="lang-switcher__globe" aria-hidden="true" />
        <span class="lang-switcher__code">{{ compact ? activeLang().codeDisplay : activeLang().label }}</span>
        <svg class="lang-switcher__caret" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      @if (open()) {
        <ul class="lang-switcher__menu" role="listbox" aria-label="Language / Idioma / Llengua">
          @for (lang of langs; track lang.code) {
            <li
              role="option"
              class="lang-switcher__option"
              [class.lang-switcher__option--active]="lang.code === activeLang().code"
              [attr.aria-selected]="lang.code === activeLang().code"
              (click)="select(lang.code)"
            >
              <span class="lang-flag" [attr.data-lang]="lang.code" aria-hidden="true"></span>
              <span class="lang-switcher__label">{{ lang.label }}</span>
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    :host { position: relative; display: block; }

    .lang-switcher { position: relative; }

    .lang-switcher__trigger {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: var(--kids-paper, #fff);
      border: 1.5px solid var(--kids-line, #E3E7F0);
      border-radius: 999px;
      padding: 9px 16px;
      cursor: pointer;
      font-family: var(--kids-font-ui, sans-serif);
      transition: border-color 150ms, box-shadow 150ms;
      white-space: nowrap;
      min-height: 40px;
      line-height: 1;
    }
    .lang-switcher__trigger:hover {
      border-color: var(--kids-navy-400, #6A82B8);
      box-shadow: 0 2px 6px rgba(31, 58, 122, 0.08);
    }

    /* Globe icon — render via lucide [size]="18" — these rules ensure alignment */
    .lang-switcher__globe {
      flex-shrink: 0;
      color: var(--kids-navy, #1F3A7A);
      display: inline-flex;
      align-items: center;
    }
    .lang-switcher__globe ::ng-deep svg {
      width: 18px;
      height: 18px;
      stroke-width: 1.8;
      display: block;
    }

    .lang-switcher__code {
      font-size: 0.9375rem; /* 15px */
      letter-spacing: 0.02em;
      font-weight: 700;
      color: var(--kids-navy, #1F3A7A);
      line-height: 1;
    }

    .lang-switcher__caret {
      width: 14px;
      height: 14px;
      transition: transform 150ms;
      color: var(--kids-slate, #4C5773);
      flex-shrink: 0;
      margin-left: 2px;
    }
    .lang-switcher--open .lang-switcher__caret { transform: rotate(180deg); }

    .lang-switcher__menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      min-width: 180px;
      background: var(--kids-paper, #fff);
      border: 1.5px solid var(--kids-line, #E3E7F0);
      border-radius: var(--kids-radius-lg, 20px);
      box-shadow: 0 12px 32px rgba(31, 58, 122, 0.16), 0 4px 8px rgba(31, 58, 122, 0.06);
      padding: 6px;
      list-style: none;
      margin: 0;
      z-index: 9999;
    }
    /* Variant: open upward (use in sidebar footer) */
    :host([data-direction="up"]) .lang-switcher__menu {
      top: auto;
      bottom: calc(100% + 8px);
    }

    .lang-switcher__option {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 10px;
      border-radius: var(--kids-radius-md, 8px);
      cursor: pointer;
      font-size: var(--kids-text-sm, 0.875rem);
      font-family: var(--kids-font-ui, sans-serif);
      color: var(--kids-navy, #1e3a5f);
      transition: background 120ms;
    }
    .lang-switcher__option:hover { background: var(--kids-cream, #f8f6f2); }
    .lang-switcher__option--active {
      background: var(--kids-sky-50, #f0f9ff);
      font-weight: 600; color: var(--kids-sky, #0ea5e9);
    }
    .lang-switcher__label { flex: 1; }

    /* ── CSS mini-flags ────────────────────────────────── */
    .lang-flag {
      display: inline-block;
      width: 20px;
      height: 14px;
      border-radius: 2px;
      flex-shrink: 0;
      border: 1px solid rgba(0,0,0,.12);
      overflow: hidden;
    }

    /* Catalan senyera: 9 equal stripes, yellow-red alternating, starting yellow */
    .lang-flag[data-lang="ca"] {
      background-color: #FCDD09;
      background-image: repeating-linear-gradient(
        to bottom,
        transparent 0%,
        transparent 11.11%,
        #C8102E 11.11%,
        #C8102E 22.22%
      );
    }

    /* Spanish flag: red / yellow / red (1/4 - 1/2 - 1/4) */
    .lang-flag[data-lang="es"] {
      background: linear-gradient(
        to bottom,
        #C60B1E 0 25%,
        #F1BF00 25% 75%,
        #C60B1E 75%
      );
    }

    /* UK flag: simplified Union Jack — navy + white cross + red center */
    .lang-flag[data-lang="en"] {
      background-color: #012169;
      background-image:
        linear-gradient(to bottom, transparent 42%, #C8102E 42%, #C8102E 58%, transparent 58%),
        linear-gradient(to right,  transparent 42%, #C8102E 42%, #C8102E 58%, transparent 58%),
        linear-gradient(to bottom, transparent 37%, white 37%, white 63%, transparent 63%),
        linear-gradient(to right,  transparent 37%, white 37%, white 63%, transparent 63%);
    }
  `],
})
export class LangSwitcherComponent implements OnInit, OnDestroy {
  private readonly transloco = inject(TranslocoService);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Where the dropdown opens: 'down' (default, for top placements) or 'up' (sidebar footer). */
  @Input() direction: 'down' | 'up' = 'down';

  /** Compact mode shows only the language code (e.g. "CA"); default shows full label ("Català"). */
  @Input() compact = false;

  @HostBinding('attr.data-direction')
  get directionAttr(): string { return this.direction; }

  readonly Globe = Globe;

  readonly open = signal(false);
  readonly activeLang = signal<LangOption>({
    code: 'ca', codeDisplay: 'CA', label: 'Català',
  });

  readonly langs: LangOption[] = [
    { code: 'ca', codeDisplay: 'CA', label: 'Català'  },
    { code: 'es', codeDisplay: 'ES', label: 'Español' },
    { code: 'en', codeDisplay: 'EN', label: 'English' },
  ];

  private readonly _docClickBound: () => void;

  constructor() {
    this._docClickBound = () => {
      if (this.open()) {
        this.open.set(false);
      }
    };
  }

  ngOnInit(): void {
    this._syncLang(this.transloco.getActiveLang());
    this.transloco.langChanges$.subscribe((lang: string) => {
      this._syncLang(lang);
      this.cdr.markForCheck();
    });
    document.addEventListener('click', this._docClickBound);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this._docClickBound);
  }

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.open.update((v: boolean) => !v);
  }

  select(code: string): void {
    this.transloco.setActiveLang(code);
    this.open.set(false);
  }

  private _syncLang(code: string): void {
    const found = this.langs.find((l: LangOption) => l.code === code);
    if (found) {
      this.activeLang.set(found);
    }
  }
}
