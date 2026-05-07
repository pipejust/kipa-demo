import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, distinctUntilChanged, takeUntil } from 'rxjs';
import { LucideAngularModule, Plus, Filter, FileText, RefreshCw } from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';

import { Admission } from '../../../shared/models/admission.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge.component';
import { AdmissionsService } from '../admissions.service';

@Component({
  selector: 'kipa-admissions-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule, StatusBadgeComponent, TranslocoModule],
  templateUrl: './admissions-list.component.html',
  styleUrl: './admissions-list.component.scss',
})
export class AdmissionsListComponent implements OnInit, OnDestroy {
  private readonly admissions = inject(AdmissionsService);
  private readonly destroy$ = new Subject<void>();

  readonly Plus = Plus;
  readonly Filter = Filter;
  readonly FileText = FileText;
  readonly RefreshCw = RefreshCw;

  readonly statusControl = new FormControl<string>('', { nonNullable: true });

  readonly statusOptions = [
    { value: '', label: 'Tots els estats' },
    { value: 'draft', label: 'Esborrany' },
    { value: 'submitted', label: 'Presentada' },
    { value: 'in_review', label: 'En revisió' },
    { value: 'admitted', label: 'Admès' },
    { value: 'rejected', label: 'Rebutjada' },
  ];

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = signal<Admission[]>([]);

  ngOnInit(): void {
    this.statusControl.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.fetch());
    this.fetch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetch(): void {
    this.loading.set(true);
    this.error.set(null);
    this.admissions.list({ status: this.statusControl.value }).subscribe({
      next: (res) => {
        const arr = res.data ?? res.items ?? res.results ?? [];
        this.items.set(arr);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No s\'han pogut carregar les admissions.');
      },
    });
  }

  trackById(_index: number, item: Admission): string {
    return item.id;
  }

  generatePdf(item: Admission): void {
    this.admissions.generatePdf(item.id).subscribe({
      next: (res) => {
        if (res?.url) {
          window.open(res.url, '_blank', 'noopener');
        }
      },
      error: () => undefined,
    });
  }

  countByStatus(status: string): number {
    return this.items().filter(a => a.status === status).length;
  }

  studentInitials(a: Admission): string {
    const name = a.alumno_nombre ?? '';
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
  }
}
