import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslocoModule } from '@jsverse/transloco';
import { LucideAngularModule, ArrowLeft, CheckCircle, FileText, Clock } from 'lucide-angular';

interface AdmissionDetail {
  id: string;
  alumno_nombre?: string;
  anio_escolar: string;
  nivel_solicitado: string;
  status: string;
  current_step: number;
  submitted_at: string | null;
  pdf_url: string | null;
  created_at: string;
  form_data: {
    alumno?: { nombre?: string; apellidos?: string; nivel?: string; fecha_nacimiento?: string };
    matricula?: { horario?: string; dias?: string; classe?: string; observaciones?: string };
  };
}

@Component({
  selector: 'kipa-family-admission-detail',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslocoModule],
  template: `
    <section class="adm-detail">
      <button type="button" class="back-link" (click)="back()">
        <lucide-icon [img]="ArrowLeft" />
        <span>{{ 'familyAdmissionDetail.back' | transloco }}</span>
      </button>

      @if (loading()) {
        <p>{{ 'common.loading' | transloco }}…</p>
      }
      @if (!loading() && adm(); as a) {
        <header class="adm-hero">
          <div>
            <p class="adm-hero__eyebrow">{{ 'familyAdmissionDetail.eyebrow' | transloco }}</p>
            <h1 class="adm-hero__title">
              {{ 'familyAdmissionDetail.title' | transloco }} {{ a.anio_escolar }}
            </h1>
            <p class="adm-hero__sub">
              {{ 'familyAdmissionDetail.requestedLevel' | transloco }}:
              <strong>{{ a.nivel_solicitado || '—' }}</strong>
            </p>
          </div>
          <span class="kds-badge" [ngClass]="statusBadge(a.status)">
            {{ ('familyAdmissionDetail.status.' + a.status) | transloco }}
          </span>
        </header>

        <div class="adm-grid">
          <article class="adm-card">
            <h2 class="adm-card__title">{{ 'familyAdmissionDetail.progress' | transloco }}</h2>
            <ol class="adm-stepper">
              @for (s of steps(a.current_step); track s.idx) {
                <li class="adm-step" [class.adm-step--done]="s.done" [class.adm-step--active]="s.active">
                  <span class="adm-step__dot">
                    @if (s.done) { <lucide-icon [img]="CheckIcon" /> } @else { {{ s.idx }} }
                  </span>
                  <span class="adm-step__label">{{ ('familyAdmissionDetail.steps.' + s.idx) | transloco }}</span>
                </li>
              }
            </ol>
          </article>

          <article class="adm-card">
            <h2 class="adm-card__title">{{ 'familyAdmissionDetail.matricula' | transloco }}</h2>
            <dl class="adm-kv">
              <div>
                <dt>{{ 'familyAdmissionDetail.classroom' | transloco }}</dt>
                <dd>{{ a.form_data.matricula?.classe || '—' }}</dd>
              </div>
              <div>
                <dt>{{ 'familyAdmissionDetail.schedule' | transloco }}</dt>
                <dd>{{ a.form_data.matricula?.horario || '—' }}</dd>
              </div>
              <div>
                <dt>{{ 'familyAdmissionDetail.days' | transloco }}</dt>
                <dd>{{ a.form_data.matricula?.dias || '—' }}</dd>
              </div>
              <div>
                <dt>{{ 'familyAdmissionDetail.observations' | transloco }}</dt>
                <dd>{{ a.form_data.matricula?.observaciones || '—' }}</dd>
              </div>
              <div>
                <dt>{{ 'familyAdmissionDetail.submittedAt' | transloco }}</dt>
                <dd>{{ a.submitted_at ? (a.submitted_at | date:'dd/MM/yyyy') : '—' }}</dd>
              </div>
            </dl>

            @if (a.pdf_url) {
              <a class="k-btn k-btn--primary" [href]="a.pdf_url" target="_blank" rel="noopener">
                <lucide-icon [img]="FileTextIcon" />
                {{ 'familyAdmissionDetail.downloadPdf' | transloco }}
              </a>
            }
          </article>
        </div>
      }
      @if (!loading() && !adm()) {
        <p>{{ 'familyAdmissionDetail.notFound' | transloco }}</p>
      }
    </section>
  `,
  styles: [`
    :host { display: block; }
    .adm-detail { display: grid; gap: var(--kids-space-5); padding: var(--kids-space-6) 0; }
    .back-link {
      display: inline-flex; align-items: center; gap: 6px;
      background: transparent; border: 0; cursor: pointer;
      color: var(--kids-slate); font-size: var(--kids-text-sm);
      font-weight: var(--kids-w-semi);
      &:hover { color: var(--kids-navy); }
      lucide-icon { width: 16px; height: 16px; }
    }
    .adm-hero {
      background: var(--kids-paper);
      border: 1px solid var(--kids-line);
      border-radius: var(--kids-radius-xl);
      padding: var(--kids-space-6);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--kids-space-4);
      flex-wrap: wrap;
      &__eyebrow {
        margin: 0;
        font-size: var(--kids-text-xs);
        font-weight: var(--kids-w-bold);
        color: var(--kids-green);
        text-transform: uppercase;
        letter-spacing: 0.18em;
      }
      &__title {
        margin: 4px 0 8px;
        font-family: var(--kids-font-display);
        font-size: var(--kids-text-2xl);
        font-weight: var(--kids-w-bold);
        color: var(--kids-navy);
      }
      &__sub { margin: 0; color: var(--kids-slate); font-size: var(--kids-text-sm); }
    }
    .adm-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--kids-space-4);
    }
    @media (max-width: 900px) { .adm-grid { grid-template-columns: 1fr; } }
    .adm-card {
      background: var(--kids-paper);
      border: 1px solid var(--kids-line);
      border-radius: var(--kids-radius-lg);
      padding: var(--kids-space-5);
      display: grid;
      gap: var(--kids-space-4);
      &__title {
        margin: 0;
        font-family: var(--kids-font-display);
        font-size: var(--kids-text-lg);
        font-weight: var(--kids-w-semi);
        color: var(--kids-navy);
      }
    }
    .adm-stepper {
      list-style: none; margin: 0; padding: 0;
      display: grid; gap: var(--kids-space-3);
    }
    .adm-step {
      display: flex; align-items: center; gap: var(--kids-space-3);
      &__dot {
        width: 28px; height: 28px; border-radius: 999px;
        background: var(--kids-surface);
        color: var(--kids-slate);
        display: grid; place-items: center;
        font-weight: var(--kids-w-bold);
        font-size: var(--kids-text-xs);
        flex-shrink: 0;
        lucide-icon { width: 14px; height: 14px; }
      }
      &__label { color: var(--kids-slate); font-size: var(--kids-text-sm); }
      &--done .adm-step__dot { background: var(--kids-green); color: #fff; }
      &--done .adm-step__label { color: var(--kids-navy); font-weight: var(--kids-w-medium); }
      &--active .adm-step__dot { background: var(--kids-navy); color: #fff; box-shadow: 0 0 0 3px var(--kids-navy-200); }
      &--active .adm-step__label { color: var(--kids-navy); font-weight: var(--kids-w-bold); }
    }
    .adm-kv {
      margin: 0; display: grid; gap: var(--kids-space-3);
      div { display: grid; gap: 4px; }
      dt {
        margin: 0;
        font-size: var(--kids-text-xs);
        color: var(--kids-slate);
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      dd {
        margin: 0;
        color: var(--kids-navy);
        font-weight: var(--kids-w-medium);
      }
    }
  `],
})
export class FamilyAdmissionDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  readonly ArrowLeft = ArrowLeft;
  readonly CheckIcon = CheckCircle;
  readonly FileTextIcon = FileText;

  readonly loading = signal(true);
  readonly adm = signal<AdmissionDetail | null>(null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/f/admisions']);
      return;
    }
    this.http.get<AdmissionDetail>(`/api/v1/admissions/${id}`).subscribe({
      next: (a) => { this.adm.set(a); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  back(): void { this.router.navigate(['/f/admisions']); }

  steps(current: number) {
    return Array.from({ length: 8 }).map((_, i) => {
      const idx = i + 1;
      return { idx, done: idx < current, active: idx === current };
    });
  }

  statusBadge(s: string): string {
    if (s === 'enrolled' || s === 'admitted' || s === 'approved') return 'kds-badge--success';
    if (s === 'rejected' || s === 'withdrawn') return 'kds-badge--danger';
    if (s === 'in_review' || s === 'reviewing' || s === 'documents_pending') return 'kds-badge--info';
    return 'kds-badge--neutral';
  }
}
