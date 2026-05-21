import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { LucideAngularModule, ArrowLeft, Download, Search, FileText } from 'lucide-angular';

interface Recibo {
  id: string;
  numero: string;
  alumno: string;
  concepto: string;
  importe: number;
  fechaEmision: string;
  pagoTipo: 'sepa' | 'stripe' | 'transferencia' | 'efectivo';
}

@Component({
  selector: 'kipa-recibos-list',
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
          <h1 class="kds-page-title">{{ 'finance.recibos.title' | transloco }}</h1>
          <p class="kds-page-subtitle">{{ 'finance.recibos.subtitle' | transloco }}</p>
        </div>
        <div class="kds-filter-bar">
          <div class="kds-search">
            <lucide-icon class="kds-search__icon" [img]="Search" />
            <input
              type="search"
              class="kds-search__input"
              [placeholder]="'finance.recibos.searchPlaceholder' | transloco"
              [value]="query()"
              (input)="query.set($any($event.target).value)"
            />
          </div>
        </div>
      </div>

      <div class="kds-table-wrap">
        <table class="kds-table">
          <thead>
            <tr>
              <th>{{ 'finance.recibos.col.numero' | transloco }}</th>
              <th>{{ 'finance.recibos.col.alumno' | transloco }}</th>
              <th>{{ 'finance.recibos.col.concepto' | transloco }}</th>
              <th>{{ 'finance.recibos.col.fecha' | transloco }}</th>
              <th>{{ 'finance.recibos.col.pago' | transloco }}</th>
              <th class="num">{{ 'finance.recibos.col.importe' | transloco }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (r of filtered(); track r.id) {
              <tr>
                <td class="mono">{{ r.numero }}</td>
                <td>{{ r.alumno }}</td>
                <td class="muted">{{ r.concepto }}</td>
                <td>{{ r.fechaEmision }}</td>
                <td>
                  <span class="kds-badge"
                    [ngClass]="r.pagoTipo === 'sepa' ? 'kds-badge--info' :
                               r.pagoTipo === 'stripe' ? 'kds-badge--purple' :
                               r.pagoTipo === 'transferencia' ? 'kds-badge--neutral' :
                                                                'kds-badge--success'">
                    {{ ('finance.recibos.pagoTipo.' + r.pagoTipo) | transloco }}
                  </span>
                </td>
                <td class="num">{{ r.importe | number:'1.2-2' }} €</td>
                <td class="num">
                  <button type="button" class="k-btn k-btn--ghost k-btn--sm" (click)="download(r)">
                    <lucide-icon [img]="DownloadIcon" />
                    PDF
                  </button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="muted center">{{ 'finance.recibos.empty' | transloco }}</td></tr>
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
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: var(--kids-text-xs); }
    .muted { color: var(--kids-slate); }
    .center { text-align: center; padding: var(--kids-space-8); }
  `],
})
export class RecibosListComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly ArrowLeft = ArrowLeft;
  readonly DownloadIcon = Download;
  readonly Search = Search;
  readonly FileText = FileText;

  readonly query = signal('');

  readonly recibos = signal<Recibo[]>(this.seed());

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.recibos();
    return this.recibos().filter((r) =>
      r.numero.toLowerCase().includes(q)
      || r.alumno.toLowerCase().includes(q)
      || r.concepto.toLowerCase().includes(q));
  });

  back(): void {
    this.router.navigate(['/a/finanzas']);
  }

  download(r: Recibo): void {
    const blob = new Blob(
      [`RECIBO · KIPA · International Preschool Andorra\n\n` +
       `Número: ${r.numero}\nAlumne: ${r.alumno}\nConcepte: ${r.concepto}\n` +
       `Data emissió: ${r.fechaEmision}\nImport: ${r.importe.toFixed(2)} €\n` +
       `Forma de pagament: ${r.pagoTipo}\n\nGracias por la teva confiança.`],
      { type: 'text/plain' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recibo-${r.numero}.txt`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  private seed(): Recibo[] {
    const today = new Date();
    const fmt = (d: Date) => d.toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const minus = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return fmt(d); };
    const types: Recibo['pagoTipo'][] = ['sepa', 'stripe', 'transferencia', 'efectivo'];
    const alumnos = ['Marc Costa Martínez', 'Emma Rodríguez López', 'Júlia Serra Vidal', 'Pau García Roca', 'Noa Puig Font'];
    return Array.from({ length: 18 }).map((_, i) => ({
      id: `r-${i}`,
      numero: `R-2025-${(1000 + i).toString().padStart(4, '0')}`,
      alumno: alumnos[i % alumnos.length],
      concepto: `Quota mensual ${['Setembre','Octubre','Novembre','Desembre','Gener','Febrer','Març','Abril'][i % 8]} 2025`,
      importe: 350.00,
      fechaEmision: minus(i * 3),
      pagoTipo: types[i % types.length],
    }));
  }
}
