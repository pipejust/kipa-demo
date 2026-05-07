import { CommonModule } from '@angular/common';
import { Component, Input, computed, signal } from '@angular/core';

import { AlumnoStatus } from '../models/alumno.model';
import { AdmissionStatus } from '../models/admission.model';

type AnyStatus = AlumnoStatus | AdmissionStatus;

interface BadgeStyle {
  label: string;
  tagClass: string;
}

const STATUS_MAP: Record<string, BadgeStyle> = {
  // Alumno states
  prospect: { label: 'Prospecte', tagClass: 'k-tag--mustard' },
  admitted: { label: 'Admès', tagClass: 'k-tag--sky' },
  enrolled: { label: 'Matriculat', tagClass: 'k-tag--green' },
  withdrawn: { label: 'Baixa', tagClass: 'k-tag--coral' },
  alumni: { label: 'Antic alumne', tagClass: 'k-tag--purple' },
  // Admission states
  draft: { label: 'Esborrany', tagClass: 'k-tag--mustard' },
  submitted: { label: 'Presentada', tagClass: 'k-tag--sky' },
  in_review: { label: 'En revisió', tagClass: 'k-tag--purple' },
  rejected: { label: 'Rebutjada', tagClass: 'k-tag--coral' },
};

@Component({
  selector: 'kipa-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="k-tag" [ngClass]="badge().tagClass">
      <span class="k-tag-dot" aria-hidden="true"></span>
      {{ badge().label }}
    </span>
  `,
})
export class StatusBadgeComponent {
  private readonly statusSignal = signal<AnyStatus>('prospect');

  @Input({ required: true })
  set status(value: AnyStatus) {
    this.statusSignal.set(value);
  }

  readonly badge = computed<BadgeStyle>(() => {
    const key = (this.statusSignal() ?? '').toString().toLowerCase();
    return STATUS_MAP[key] ?? { label: key || 'Desconegut', tagClass: 'k-tag' };
  });
}
