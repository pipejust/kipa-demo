import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { LucideAngularModule, ArrowLeft, Download, FileText, BarChart3, TrendingUp, Users, Calendar, Euro } from 'lucide-angular';

interface ReportItem {
  id: string;
  title: string;
  description: string;
  category: 'financial' | 'pedagogical' | 'attendance' | 'admission' | 'nps';
  icon: 'chart' | 'trend' | 'users' | 'cal' | 'euro' | 'file';
  period: string;
  rows: number;
}

@Component({
  selector: 'kipa-reports',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslocoModule],
  template: `
    <section class="kds-page reports-page">
      <header class="kds-page-header">
        <div>
          <button type="button" class="back-link" (click)="back()">
            <lucide-icon [img]="ArrowLeft" />
            <span>{{ 'reports.back' | transloco }}</span>
          </button>
          <h1 class="kds-page-title">{{ 'reports.title' | transloco }}</h1>
          <p class="kds-page-subtitle">{{ 'reports.subtitle' | transloco }}</p>
        </div>
      </header>

      <nav class="reports-tabs">
        @for (cat of cats; track cat) {
          <button
            type="button"
            class="reports-tab"
            [class.reports-tab--active]="activeCat() === cat"
            (click)="activeCat.set(cat)"
          >
            {{ ('reports.cats.' + cat) | transloco }}
          </button>
        }
      </nav>

      <ul class="reports-grid">
        @for (r of filtered(); track r.id) {
          <li class="report-card" [ngClass]="'report-card--' + r.category">
            <div class="report-card__icon">
              <lucide-icon [img]="iconFor(r.icon)" />
            </div>
            <div class="report-card__body">
              <h3 class="report-card__title">{{ r.title }}</h3>
              <p class="report-card__desc">{{ r.description }}</p>
              <p class="report-card__meta">
                <span>{{ 'reports.period' | transloco }}: <strong>{{ r.period }}</strong></span>
                <span>·</span>
                <span>{{ r.rows }} {{ 'reports.rows' | transloco }}</span>
              </p>
            </div>
            <div class="report-card__actions">
              <button type="button" class="k-btn k-btn--ghost k-btn--sm" (click)="preview(r)">
                {{ 'reports.preview' | transloco }}
              </button>
              <button type="button" class="k-btn k-btn--primary k-btn--sm" (click)="download(r, 'csv')">
                <lucide-icon [img]="DownloadIcon" />
                CSV
              </button>
              <button type="button" class="k-btn k-btn--ghost k-btn--sm" (click)="download(r, 'pdf')">
                <lucide-icon [img]="DownloadIcon" />
                PDF
              </button>
            </div>
          </li>
        }
      </ul>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .reports-page { display: grid; gap: var(--kids-space-5); padding: var(--kids-space-6) 0; }
    .back-link {
      display: inline-flex; align-items: center; gap: 6px;
      background: transparent; border: 0; cursor: pointer;
      color: var(--kids-slate); font-size: var(--kids-text-sm);
      font-weight: var(--kids-w-semi); padding: 0 0 8px;
      &:hover { color: var(--kids-navy); }
      lucide-icon { width: 16px; height: 16px; }
    }
    .reports-tabs {
      display: flex; gap: 2px;
      border-bottom: 2px solid var(--kids-line);
      overflow-x: auto;
    }
    .reports-tab {
      padding: 10px 16px;
      background: transparent; border: 0; cursor: pointer;
      font-size: var(--kids-text-sm);
      font-weight: var(--kids-w-medium);
      color: var(--kids-slate);
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      white-space: nowrap;
      &--active {
        color: var(--kids-navy);
        font-weight: var(--kids-w-semi);
        border-bottom-color: var(--kids-green);
      }
    }
    .reports-grid {
      list-style: none; margin: 0; padding: 0;
      display: grid; gap: var(--kids-space-3);
    }
    .report-card {
      display: grid;
      grid-template-columns: 56px 1fr auto;
      gap: var(--kids-space-4);
      align-items: center;
      background: var(--kids-paper);
      border: 1px solid var(--kids-line);
      border-radius: var(--kids-radius-lg);
      padding: var(--kids-space-4);
      box-shadow: var(--kids-shadow-sm);

      &__icon {
        width: 48px; height: 48px;
        border-radius: var(--kids-radius-md);
        display: grid; place-items: center;
        background: var(--kids-navy-50); color: var(--kids-navy);
        lucide-icon { width: 22px; height: 22px; }
      }
      &--financial    .report-card__icon { background: #FDECC5; color: #B97E0E; }
      &--pedagogical  .report-card__icon { background: #D6EEE0; color: #1F8E5A; }
      &--attendance   .report-card__icon { background: #DCF1FB; color: #1E84BB; }
      &--admission    .report-card__icon { background: #E6D9F2; color: #5B2E85; }
      &--nps          .report-card__icon { background: #FBDAE8; color: #C73579; }

      &__body { display: grid; gap: 4px; min-width: 0; }
      &__title {
        margin: 0;
        font-family: var(--kids-font-display);
        font-size: var(--kids-text-md);
        font-weight: var(--kids-w-semi);
        color: var(--kids-navy);
      }
      &__desc { margin: 0; color: var(--kids-slate); font-size: var(--kids-text-sm); }
      &__meta {
        margin: 4px 0 0;
        display: flex; gap: 6px;
        font-size: var(--kids-text-xs); color: var(--kids-muted);
        strong { color: var(--kids-navy); }
      }
      &__actions {
        display: flex; gap: var(--kids-space-2);
      }
    }
    @media (max-width: 720px) {
      .report-card { grid-template-columns: 48px 1fr; }
      .report-card__actions { grid-column: 1 / -1; justify-content: flex-end; flex-wrap: wrap; }
    }
  `],
})
export class ReportsComponent {
  private readonly router = inject(Router);
  readonly ArrowLeft = ArrowLeft;
  readonly DownloadIcon = Download;

  readonly cats = ['all', 'financial', 'pedagogical', 'attendance', 'admission', 'nps'] as const;
  readonly activeCat = signal<typeof this.cats[number]>('all');

  readonly all = signal<ReportItem[]>([
    { id: 'r1', title: 'Estat financer mensual',          description: 'Cobrades, pendents, devolucions per nivell i família.', category: 'financial',   icon: 'euro',  period: 'Maig 2026', rows: 124 },
    { id: 'r2', title: 'Morositat trimestral',            description: 'Famílies amb cuotes pendents > 30 dies.',               category: 'financial',   icon: 'trend', period: 'Q1 2026',   rows: 8 },
    { id: 'r3', title: 'Resum d\'admissions',             description: 'Sol·licituds rebudes, aprovades i pendents per nivell.',category: 'admission',   icon: 'users', period: 'Curs 25-26',rows: 47 },
    { id: 'r4', title: 'Assistència mensual per aula',    description: 'Percentatges de presència / absència / tardances.',     category: 'attendance',  icon: 'cal',   period: 'Abril 2026',rows: 56 },
    { id: 'r5', title: 'NPS trimestral',                  description: 'Net Promoter Score amb desglossament per nivell.',      category: 'nps',         icon: 'chart', period: 'Q1 2026',   rows: 92 },
    { id: 'r6', title: 'Observacions pedagògiques',       description: 'Evolució per àrees (motora, llenguatge, social, etc.).',category: 'pedagogical', icon: 'file',  period: 'Curs 25-26',rows: 320 },
    { id: 'r7', title: 'Ràtio Personal Teacher Ratio',    description: 'PTR per aula i mes amb tendència anual.',               category: 'attendance',  icon: 'users', period: 'Curs 25-26',rows: 12 },
    { id: 'r8', title: 'EBITDA estimat',                  description: 'Aproximació mensual basada en cuotes i nòmines.',       category: 'financial',   icon: 'chart', period: 'Curs 25-26',rows: 12 },
    { id: 'r9', title: 'Captació de nous alumnes',        description: 'Embut: visites > sol·licituds > matriculacions.',       category: 'admission',   icon: 'trend', period: 'Curs 25-26',rows: 64 },
  ]);

  readonly filtered = signal<ReportItem[]>([]);

  constructor() {
    // sync filtered when activeCat or all change
    this.filtered.set(this.all());
  }

  iconFor(k: ReportItem['icon']) {
    return k === 'chart' ? BarChart3
         : k === 'trend' ? TrendingUp
         : k === 'users' ? Users
         : k === 'cal'   ? Calendar
         : k === 'euro'  ? Euro
                         : FileText;
  }

  back(): void { this.router.navigate(['/a/dashboard']); }

  preview(r: ReportItem): void {
    alert(`Vista prèvia · ${r.title}\n\n(En la versió real obriria un visor de dades en línia amb taula filtrable.)`);
  }

  download(r: ReportItem, fmt: 'csv' | 'pdf'): void {
    const blob = new Blob(
      [`KIPA · Informe\n\nTítol: ${r.title}\nDescripció: ${r.description}\nPeríode: ${r.period}\nFiles: ${r.rows}\nFormat: ${fmt}\n\n` +
       `Aquest és un fitxer demo. En producció generaria el CSV/PDF real amb les dades agregades.`],
      { type: fmt === 'csv' ? 'text/csv' : 'application/pdf' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${r.title.replace(/[\\/:*?"<>|]/g, '-')}.${fmt}`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }
}
