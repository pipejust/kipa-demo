import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { LucideAngularModule, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-angular';

interface Devolucion {
  id: string;
  alumno: string;
  periodo: string;
  importe: number;
  motivo: 'fondos_insuficientes' | 'cuenta_cancelada' | 'mandato_revocado' | 'datos_incorrectos' | 'otro';
  fecha: string;
  resuelta: boolean;
  nota?: string;
}

@Component({
  selector: 'kipa-devoluciones-list',
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
          <h1 class="kds-page-title">{{ 'finance.devoluciones.title' | transloco }}</h1>
          <p class="kds-page-subtitle">{{ 'finance.devoluciones.subtitle' | transloco }}</p>
        </div>
        <div class="kds-kpi-grid kpi-mini">
          <div class="kds-stat-card">
            <span class="kds-stat-card__label">{{ 'finance.devoluciones.pending' | transloco }}</span>
            <span class="kds-stat-card__value">{{ pendingCount() }}</span>
          </div>
          <div class="kds-stat-card">
            <span class="kds-stat-card__label">{{ 'finance.devoluciones.resolved' | transloco }}</span>
            <span class="kds-stat-card__value">{{ resolvedCount() }}</span>
          </div>
          <div class="kds-stat-card">
            <span class="kds-stat-card__label">{{ 'finance.devoluciones.totalAmount' | transloco }}</span>
            <span class="kds-stat-card__value">{{ totalAmount() | number:'1.2-2' }} €</span>
          </div>
        </div>
      </div>

      <div class="kds-table-wrap">
        <table class="kds-table">
          <thead>
            <tr>
              <th>{{ 'finance.devoluciones.col.alumno' | transloco }}</th>
              <th>{{ 'finance.devoluciones.col.periodo' | transloco }}</th>
              <th class="num">{{ 'finance.devoluciones.col.importe' | transloco }}</th>
              <th>{{ 'finance.devoluciones.col.motivo' | transloco }}</th>
              <th>{{ 'finance.devoluciones.col.fecha' | transloco }}</th>
              <th>{{ 'finance.devoluciones.col.estado' | transloco }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (d of items(); track d.id) {
              <tr>
                <td>{{ d.alumno }}</td>
                <td>{{ d.periodo }}</td>
                <td class="num">{{ d.importe | number:'1.2-2' }} €</td>
                <td>
                  <span class="kds-badge kds-badge--warning">
                    {{ ('finance.devoluciones.motivo.' + d.motivo) | transloco }}
                  </span>
                </td>
                <td>{{ d.fecha }}</td>
                <td>
                  @if (d.resuelta) {
                    <span class="kds-badge kds-badge--success">{{ 'finance.devoluciones.statusResolved' | transloco }}</span>
                  } @else {
                    <span class="kds-badge kds-badge--danger">{{ 'finance.devoluciones.statusPending' | transloco }}</span>
                  }
                </td>
                <td class="num">
                  @if (!d.resuelta) {
                    <button type="button" class="k-btn k-btn--ghost k-btn--sm" (click)="resolve(d)">
                      <lucide-icon [img]="CheckIcon" />
                      {{ 'finance.devoluciones.resolve' | transloco }}
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="center muted">{{ 'finance.devoluciones.empty' | transloco }}</td></tr>
            }
          </tbody>
        </table>
      </div>
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
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .muted { color: var(--kids-slate); }
    .center { text-align: center; padding: var(--kids-space-8); }
    .kpi-mini { margin: 0; }
  `],
})
export class DevolucionesListComponent {
  private readonly router = inject(Router);
  readonly ArrowLeft = ArrowLeft;
  readonly CheckIcon = CheckCircle;
  readonly AlertIcon = AlertTriangle;

  readonly items = signal<Devolucion[]>(this.seed());
  readonly pendingCount = computed(() => this.items().filter((d) => !d.resuelta).length);
  readonly resolvedCount = computed(() => this.items().filter((d) => d.resuelta).length);
  readonly totalAmount = computed(() =>
    this.items().filter((d) => !d.resuelta).reduce((s, d) => s + d.importe, 0));

  back(): void { this.router.navigate(['/a/finanzas']); }

  resolve(d: Devolucion): void {
    this.items.update((list) =>
      list.map((x) => x.id === d.id ? { ...x, resuelta: true } : x));
  }

  private seed(): Devolucion[] {
    return [
      { id: 'dv1', alumno: 'Pau García Roca',         periodo: '2026-04', importe: 350, motivo: 'fondos_insuficientes', fecha: '08/04/2026', resuelta: false },
      { id: 'dv2', alumno: 'Noa Puig Font',           periodo: '2026-03', importe: 350, motivo: 'mandato_revocado',     fecha: '10/03/2026', resuelta: false },
      { id: 'dv3', alumno: 'Bernat Mas',              periodo: '2026-02', importe: 350, motivo: 'datos_incorrectos',    fecha: '12/02/2026', resuelta: true, nota: 'Confirmat amb la família, IBAN corregit.' },
      { id: 'dv4', alumno: 'Aina Roig',               periodo: '2026-01', importe: 350, motivo: 'fondos_insuficientes', fecha: '15/01/2026', resuelta: true },
      { id: 'dv5', alumno: 'Oriol Vidal',             periodo: '2025-12', importe: 350, motivo: 'otro',                 fecha: '18/12/2025', resuelta: true },
    ];
  }
}
