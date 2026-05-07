import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  CalendarDays,
} from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';

import { AttendanceService } from './attendance.service';
import type { AsistenciaEstado, AsistenciaOut } from '../../core/api/types.gen';

// Ordered alumno list would come from StudentsService; for tablet UI we work with
// what the attendance endpoint returns for a given date.
interface AttendanceRow {
  alumno_id: string;
  alumno_nombre?: string;
  estado: AsistenciaEstado;
  nota?: string;
  saving: boolean;
}

const ESTADO_LABEL: Record<AsistenciaEstado, string> = {
  presente: 'Present',
  ausente: 'Absent',
  tarde: 'Tardança',
  justificado: 'Justificat',
};

const ESTADO_CLASS: Record<AsistenciaEstado, string> = {
  presente: 'estado--ok',
  ausente: 'estado--error',
  tarde: 'estado--warn',
  justificado: 'estado--info',
};

const ESTADOS: AsistenciaEstado[] = ['presente', 'ausente', 'tarde', 'justificado'];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  selector: 'kipa-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, DatePipe, TranslocoModule],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.scss',
})
export class AttendanceComponent implements OnInit {
  private readonly svc = inject(AttendanceService);

  readonly CheckCircle2 = CheckCircle2;
  readonly XCircle = XCircle;
  readonly Clock = Clock;
  readonly AlertCircle = AlertCircle;
  readonly RefreshCw = RefreshCw;
  readonly CalendarDays = CalendarDays;

  readonly estados: AsistenciaEstado[] = ESTADOS;
  readonly fecha = signal(todayIso());
  readonly rows = signal<AttendanceRow[]>([]);
  readonly loading = signal(true);

  readonly presentCount    = computed(() => this.rows().filter((r) => r.estado === 'presente').length);
  readonly absentCount     = computed(() => this.rows().filter((r) => r.estado === 'ausente').length);
  readonly tardeCount      = computed(() => this.rows().filter((r) => r.estado === 'tarde').length);
  readonly justificatCount = computed(() => this.rows().filter((r) => r.estado === 'justificado').length);
  readonly totalCount      = computed(() => this.rows().length);

  readonly presentPct    = computed(() => this.totalCount() ? Math.round(this.presentCount()    / this.totalCount() * 100) : 0);
  readonly absentPct     = computed(() => this.totalCount() ? Math.round(this.absentCount()     / this.totalCount() * 100) : 0);
  readonly tardePct      = computed(() => this.totalCount() ? Math.round(this.tardeCount()      / this.totalCount() * 100) : 0);
  readonly justificatPct = computed(() => this.totalCount() ? Math.round(this.justificatCount() / this.totalCount() * 100) : 0);

  /** Stroke-dashoffset for the donut ring (circumference 163.36 for r=26). */
  readonly donutOffset = computed(() => ((100 - this.presentPct()) / 100) * 163.36);

  todayIso = todayIso;

  alumnoInitials(name?: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.listForDate(this.fecha()).subscribe({
      next: (r) => {
        this.rows.set(
          r.data.map((a) => ({
            alumno_id: a.alumno_id,
            estado: a.estado,
            nota: a.nota ?? undefined,
            saving: false,
          }))
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onDateChange(ev: Event): void {
    const val = (ev.target as HTMLInputElement).value;
    if (val) { this.fecha.set(val); this.load(); }
  }

  setEstado(row: AttendanceRow, estat: AsistenciaEstado): void {
    if (row.estado === estat) return;
    row.saving = true;
    this.svc.upsert({
      alumno_id: row.alumno_id,
      fecha: this.fecha(),
      estado: estat,
    }).subscribe({
      next: () => {
        row.estado = estat;
        row.saving = false;
        this.rows.update((list) => [...list]);
      },
      error: () => { row.saving = false; this.rows.update((list) => [...list]); },
    });
  }

  estadoLabel(e: AsistenciaEstado): string { return ESTADO_LABEL[e]; }
  estadoClass(e: AsistenciaEstado): string { return ESTADO_CLASS[e]; }
}
