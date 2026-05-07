import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, FileText, Clock, CheckCircle2, XCircle, ChevronRight } from 'lucide-angular';

import { AdmissionsService } from '../../../features/admissions/admissions.service';

interface FamilyAdmission {
  id: string;
  alumno_nombre?: string;
  anio_escolar: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Esborrany',
  submitted: 'Enviada',
  under_review: 'En revisió',
  documents_complete: 'Documents OK',
  interview_scheduled: 'Entrevista prevista',
  accepted: 'Acceptada',
  rejected: 'Denegada',
  waitlisted: 'Llista espera',
  enrolled: 'Matriculat',
};

const STATUS_CLASS: Record<string, string> = {
  draft: 'tag--muted',
  submitted: 'tag--info',
  under_review: 'tag--info',
  documents_complete: 'tag--info',
  interview_scheduled: 'tag--warn',
  accepted: 'tag--ok',
  rejected: 'tag--error',
  waitlisted: 'tag--warn',
  enrolled: 'tag--ok',
};

@Component({
  selector: 'kipa-family-admissions',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, DatePipe],
  templateUrl: './family-admissions.component.html',
  styleUrl: './family-admissions.component.scss',
})
export class FamilyAdmissionsComponent implements OnInit {
  private readonly admissionsSvc = inject(AdmissionsService);

  readonly FileText = FileText;
  readonly Clock = Clock;
  readonly CheckCircle2 = CheckCircle2;
  readonly XCircle = XCircle;
  readonly ChevronRight = ChevronRight;

  readonly loading = signal(true);
  readonly admissions = signal<FamilyAdmission[]>([]);

  ngOnInit(): void {
    this.admissionsSvc.list().subscribe({
      next: (r) => { this.admissions.set((r as any).data ?? r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  statusLabel(s: string): string { return STATUS_LABEL[s] ?? s; }
  statusClass(s: string): string { return STATUS_CLASS[s] ?? 'tag--muted'; }
}
