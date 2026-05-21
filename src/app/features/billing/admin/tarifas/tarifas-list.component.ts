import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { LucideAngularModule, ArrowLeft, Plus, Pencil, Archive } from 'lucide-angular';

interface Tarifa {
  id: string;
  nombre: string;
  nivel: string;
  anioEscolar: string;
  importeMensual: number;
  descuentoAnualPct: number;
  conceptos: { label: string; amount: number }[];
  activa: boolean;
}

@Component({
  selector: 'kipa-tarifas-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslocoModule],
  template: `
    <section class="kds-page">
      <div class="kds-page-header">
        <div>
          <button type="button" class="back-link" (click)="back()">
            <lucide-icon [img]="ArrowLeft" />
            <span>{{ 'finance.dashboard.title' | transloco }}</span>
          </button>
          <h1 class="kds-page-title">{{ 'finance.tarifas.title' | transloco }}</h1>
          <p class="kds-page-subtitle">{{ 'finance.tarifas.subtitle' | transloco }}</p>
        </div>
        <button type="button" class="k-btn k-btn--primary" (click)="openCreate()">
          <lucide-icon [img]="PlusIcon" />
          {{ 'finance.tarifas.new' | transloco }}
        </button>
      </div>

      <ul class="tarifas-grid">
        @for (t of tarifas(); track t.id) {
          <li class="tarifa-card" [class.tarifa-card--archived]="!t.activa">
            <header class="tarifa-card__head">
              <div>
                <h3 class="tarifa-card__title">{{ t.nombre }}</h3>
                <p class="tarifa-card__sub">{{ t.nivel }} · {{ 'finance.tarifas.year' | transloco }} {{ t.anioEscolar }}</p>
              </div>
              <span class="kds-badge" [ngClass]="t.activa ? 'kds-badge--success' : 'kds-badge--neutral'">
                {{ (t.activa ? 'finance.tarifas.active' : 'finance.tarifas.archived') | transloco }}
              </span>
            </header>

            <div class="tarifa-card__price">
              <span class="tarifa-card__amount">{{ t.importeMensual | number:'1.2-2' }} €</span>
              <span class="tarifa-card__period">/ {{ 'finance.tarifas.perMonth' | transloco }}</span>
            </div>

            <dl class="tarifa-card__concepts">
              @for (c of t.conceptos; track c.label) {
                <div>
                  <dt>{{ c.label }}</dt>
                  <dd>{{ c.amount | number:'1.2-2' }} €</dd>
                </div>
              }
              <div>
                <dt>{{ 'finance.tarifas.earlyPaymentDiscount' | transloco }}</dt>
                <dd>{{ t.descuentoAnualPct }}%</dd>
              </div>
            </dl>

            <footer class="tarifa-card__actions">
              <button type="button" class="k-btn k-btn--ghost k-btn--sm" (click)="edit(t)">
                <lucide-icon [img]="PencilIcon" />
                {{ 'finance.tarifas.edit' | transloco }}
              </button>
              <button type="button" class="k-btn k-btn--ghost k-btn--sm" (click)="toggleArchive(t)">
                <lucide-icon [img]="ArchiveIcon" />
                {{ (t.activa ? 'finance.tarifas.archive' : 'finance.tarifas.restore') | transloco }}
              </button>
            </footer>
          </li>
        } @empty {
          <li class="kds-empty">
            <p class="kds-empty__title">{{ 'finance.tarifas.empty' | transloco }}</p>
          </li>
        }
      </ul>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .back-link {
      display: inline-flex; align-items: center; gap: 6px;
      background: transparent; border: 0; cursor: pointer;
      color: var(--kids-slate); font-size: var(--kids-text-sm);
      font-weight: var(--kids-w-semi); padding: 0 0 8px;
      &:hover { color: var(--kids-navy); }
      lucide-icon { width: 16px; height: 16px; }
    }
    .tarifas-grid {
      list-style: none; margin: 0; padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--kids-space-4);
    }
    .tarifa-card {
      background: var(--kids-paper);
      border: 1px solid var(--kids-line);
      border-radius: var(--kids-radius-lg);
      padding: var(--kids-space-5);
      box-shadow: var(--kids-shadow-sm);
      display: grid;
      gap: var(--kids-space-4);
      transition: opacity var(--kids-dur) var(--kids-ease);

      &--archived { opacity: 0.6; }

      &__head {
        display: flex; align-items: flex-start; justify-content: space-between;
        gap: var(--kids-space-3);
      }
      &__title {
        margin: 0; font-family: var(--kids-font-display);
        font-size: var(--kids-text-md); font-weight: var(--kids-w-semi);
        color: var(--kids-navy);
      }
      &__sub {
        margin: 4px 0 0; font-size: var(--kids-text-xs);
        color: var(--kids-slate); text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      &__price {
        display: flex; align-items: baseline; gap: 6px;
      }
      &__amount {
        font-family: var(--kids-font-display);
        font-size: var(--kids-text-3xl);
        font-weight: var(--kids-w-bold);
        color: var(--kids-navy);
        line-height: 1;
      }
      &__period {
        color: var(--kids-slate); font-size: var(--kids-text-sm);
      }
      &__concepts {
        margin: 0; display: grid; gap: 6px;
        padding: var(--kids-space-3);
        background: var(--kids-surface);
        border-radius: var(--kids-radius-md);

        div { display: flex; justify-content: space-between; align-items: baseline; }
        dt { color: var(--kids-slate); font-size: var(--kids-text-sm); margin: 0; }
        dd { color: var(--kids-navy); font-weight: var(--kids-w-semi); font-size: var(--kids-text-sm); margin: 0; }
      }
      &__actions {
        display: flex; gap: var(--kids-space-2);
        border-top: 1px solid var(--kids-line);
        padding-top: var(--kids-space-3);
      }
    }
  `],
})
export class TarifasListComponent {
  private readonly router = inject(Router);
  readonly ArrowLeft = ArrowLeft;
  readonly PlusIcon = Plus;
  readonly PencilIcon = Pencil;
  readonly ArchiveIcon = Archive;

  readonly tarifas = signal<Tarifa[]>([
    {
      id: 't-p1', nombre: 'Quota base P1', nivel: 'P1', anioEscolar: '2025-2026',
      importeMensual: 320, descuentoAnualPct: 3, activa: true,
      conceptos: [
        { label: 'Material didàctic', amount: 30 },
        { label: 'Càtering opcional', amount: 200 },
      ],
    },
    {
      id: 't-p2', nombre: 'Quota base P2', nivel: 'P2', anioEscolar: '2025-2026',
      importeMensual: 340, descuentoAnualPct: 3, activa: true,
      conceptos: [
        { label: 'Material didàctic', amount: 30 },
        { label: 'Càtering opcional', amount: 200 },
      ],
    },
    {
      id: 't-p3', nombre: 'Quota base P3', nivel: 'P3', anioEscolar: '2025-2026',
      importeMensual: 350, descuentoAnualPct: 3, activa: true,
      conceptos: [
        { label: 'Material didàctic', amount: 30 },
        { label: 'Càtering opcional', amount: 200 },
      ],
    },
    {
      id: 't-old', nombre: 'Quota base P3 (any anterior)', nivel: 'P3', anioEscolar: '2024-2025',
      importeMensual: 330, descuentoAnualPct: 3, activa: false,
      conceptos: [
        { label: 'Material didàctic', amount: 25 },
        { label: 'Càtering opcional', amount: 180 },
      ],
    },
  ]);

  back(): void { this.router.navigate(['/a/finanzas']); }

  openCreate(): void {
    alert('En la versió real, aquí s\'obriria un formulari per crear una tarifa nova.');
  }
  edit(t: Tarifa): void {
    alert(`Edita "${t.nombre}".\nEn la versió real, aquí s\'obriria un formulari precarregat.`);
  }
  toggleArchive(t: Tarifa): void {
    this.tarifas.update((list) => list.map((x) => x.id === t.id ? { ...x, activa: !x.activa } : x));
  }
}
