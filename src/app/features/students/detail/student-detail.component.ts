import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  CircleX,
  Clock,
  Download,
  EllipsisVertical,
  Euro,
  FileText,
  GraduationCap,
  Heart,
  History,
  Mail,
  Pencil,
  Phone,
  Save,
  Stethoscope,
  Users,
  Wallet,
  X,
  LucideAngularModule,
} from 'lucide-angular';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { Alumno, Tutor, MedicalInfo, DatosMedicosPayload } from '../../../shared/models/alumno.model';
import { Admission } from '../../../shared/models/admission.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge.component';
import { StudentsService } from '../students.service';
import { AttendanceService } from '../../attendance/attendance.service';
import { BillingService, Cuota } from '../../billing/billing.service';
import { AdmissionsService } from '../../admissions/admissions.service';
import type { AsistenciaOut, AsistenciaEstado } from '../../../core/api/types.gen';

type TabKey =
  | 'summary'
  | 'personal'
  | 'tutors'
  | 'attendance'
  | 'admission'
  | 'payments'
  | 'activity';

interface NormalizedMedical {
  alergias: string;
  medicacion: string;
  condiciones: string;
  grupo_sanguineo: string;
  medico_nombre: string;
  medico_tel: string;
  notas: string;
  hasAllergies: boolean;
  isEmpty: boolean;
}

interface AttendanceSummary {
  percent: number;
  present: number;
  absent: number;
  late: number;
  justified: number;
  series: number[];
  recent: AsistenciaOut[];
}

interface PaymentSummary {
  monthly: number | null;
  paid: number;
  total: number;
  totalPaid: number;
  totalPending: number;
  state: 'on_track' | 'overdue' | 'pending' | 'unknown';
  nextDue: string | null;
  cuotas: Cuota[];
}

interface ActivityEvent {
  id: string;
  type: 'attendance' | 'admission' | 'payment' | 'medical' | 'tutor';
  date: string;
  titleKey: string;
  titleParams?: Record<string, unknown>;
  detailKey?: string;
  detail?: string;
  color: 'green' | 'sky' | 'mustard' | 'pink' | 'purple' | 'coral';
  icon: 'attendance' | 'admission' | 'payment' | 'medical' | 'tutor' | 'message';
}

@Component({
  selector: 'kipa-student-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    StatusBadgeComponent,
    TranslocoModule,
  ],
  templateUrl: './student-detail.component.html',
  styleUrl: './student-detail.component.scss',
})
export class StudentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly studentsService = inject(StudentsService);
  private readonly attendanceService = inject(AttendanceService);
  private readonly billingService = inject(BillingService);
  private readonly admissionsService = inject(AdmissionsService);
  private readonly fb = inject(FormBuilder);
  private readonly transloco = inject(TranslocoService);

  readonly ArrowLeft = ArrowLeft;
  readonly Pencil = Pencil;
  readonly Save = Save;
  readonly Close = X;
  readonly FileText = FileText;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly CalendarDays = CalendarDays;
  readonly ChevronRight = ChevronRight;
  readonly EllipsisVertical = EllipsisVertical;
  readonly Activity = Activity;
  readonly Wallet = Wallet;
  readonly GraduationCap = GraduationCap;
  readonly Stethoscope = Stethoscope;
  readonly History = History;
  readonly Users = Users;
  readonly Euro = Euro;
  readonly CircleCheck = CircleCheck;
  readonly CircleX = CircleX;
  readonly Clock = Clock;
  readonly Heart = Heart;
  readonly Download = Download;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editMode = signal(false);
  readonly error = signal<string | null>(null);
  readonly alumno = signal<Alumno | null>(null);
  readonly currentTab = signal<TabKey>('summary');
  readonly attendance = signal<AttendanceSummary | null>(null);
  readonly payments = signal<PaymentSummary | null>(null);
  readonly admissions = signal<Admission[]>([]);
  readonly moreMenuOpen = signal(false);

  readonly tabs: ReadonlyArray<{ key: TabKey; labelKey: string }> = [
    { key: 'summary',    labelKey: 'studentDetail.tabs.summary' },
    { key: 'personal',   labelKey: 'studentDetail.tabs.personal' },
    { key: 'tutors',     labelKey: 'studentDetail.tabs.tutors' },
    { key: 'attendance', labelKey: 'studentDetail.tabs.attendance' },
    { key: 'admission',  labelKey: 'studentDetail.tabs.admission' },
    { key: 'payments',   labelKey: 'studentDetail.tabs.payments' },
    { key: 'activity',   labelKey: 'studentDetail.tabs.activity' },
  ];

  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    apellidos: ['', Validators.required],
    nivel: [''],
    aula: [''],
    fecha_nacimiento: [''],
    genero: ['' as '' | 'M' | 'F' | 'X'],
    email: ['', Validators.email],
    telefono: [''],
  });

  readonly fullName = computed(() => {
    const a = this.alumno();
    if (!a) return '';
    return a.nombre_completo ?? `${a.nombre} ${a.apellidos}`.trim();
  });

  readonly initials = computed(() => {
    const a = this.alumno();
    if (!a) return '';
    return `${(a.nombre ?? '')[0] ?? ''}${(a.apellidos ?? '')[0] ?? ''}`.toUpperCase();
  });

  readonly currentEnrollment = computed<Admission | null>(() => {
    const list = this.admissions();
    if (list.length === 0) return null;
    // Prefer the active admission with the most matriculation data attached.
    const active = list.find((a) =>
      ['enrolled', 'admitted', 'approved', 'submitted'].includes(a.status as string)
      && a.form_data?.matricula?.horario
    );
    if (active) return active;
    const anyActive = list.find((a) =>
      ['enrolled', 'admitted', 'approved', 'submitted'].includes(a.status as string)
    );
    return anyActive ?? list[0];
  });

  readonly schoolYear = computed(() => this.currentEnrollment()?.anio_escolar ?? null);

  readonly classroomLine = computed(() => {
    const a = this.alumno();
    if (!a) return '';
    if (a.aula && a.nivel) return `${a.aula} (${a.nivel})`;
    return a.aula || a.nivel || '';
  });

  readonly ageLine = computed(() => {
    const a = this.alumno();
    if (!a?.fecha_nacimiento) return '';
    const dob = new Date(a.fecha_nacimiento);
    if (Number.isNaN(dob.getTime())) return '';

    const now = new Date();
    let years = now.getFullYear() - dob.getFullYear();
    let months = now.getMonth() - dob.getMonth();
    if (now.getDate() < dob.getDate()) months -= 1;
    if (months < 0) { years -= 1; months += 12; }

    const yearsLabel  = this.transloco.translate(years === 1 ? 'studentDetail.age.year' : 'studentDetail.age.years');
    const monthsLabel = this.transloco.translate(months === 1 ? 'studentDetail.age.month' : 'studentDetail.age.months');
    const bornLabel   = this.transloco.translate('studentDetail.age.born');

    const ageStr = months > 0
      ? `${years} ${yearsLabel} ${this.transloco.translate('studentDetail.age.and')} ${months} ${monthsLabel}`
      : `${years} ${yearsLabel}`;

    return `${ageStr} · ${bornLabel} ${this.formatDate(a.fecha_nacimiento)}`;
  });

  readonly ageOnly = computed(() => {
    const a = this.alumno();
    if (!a?.fecha_nacimiento) return '';
    const dob = new Date(a.fecha_nacimiento);
    if (Number.isNaN(dob.getTime())) return '';
    const now = new Date();
    let years = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) years--;
    const yearsLabel  = this.transloco.translate(years === 1 ? 'studentDetail.age.year' : 'studentDetail.age.years');
    return `${years} ${yearsLabel}`;
  });

  readonly tutorList = computed<Tutor[]>(() => this.alumno()?.tutores ?? []);

  readonly mainTutor = computed<Tutor | null>(() => {
    const list = this.tutorList();
    if (list.length === 0) return null;
    return list.find((t) => t.es_responsable_principal || t.primario) ?? list[0] ?? null;
  });

  readonly secondaryTutors = computed<Tutor[]>(() => {
    const main = this.mainTutor();
    return this.tutorList().filter((t) => t !== main);
  });

  readonly medical = computed<NormalizedMedical>(() => {
    const a = this.alumno();
    return this.normalizeMedical(a?.datos_medicos ?? null, a?.medical ?? null);
  });

  readonly hasAllergies = computed(() => this.medical().hasAllergies);

  readonly attendanceTrend = computed<'good' | 'watch' | 'unknown'>(() => {
    const att = this.attendance();
    if (!att) return 'unknown';
    if (att.percent >= 85) return 'good';
    return 'watch';
  });

  readonly attendancePoints = computed(() => {
    const series = this.attendance()?.series ?? [];
    if (series.length === 0) return '';
    const max = Math.max(...series, 1);
    const w = 100;
    const h = 32;
    return series
      .map((value, i) => {
        const x = (i / Math.max(series.length - 1, 1)) * w;
        const y = h - (value / max) * h;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  });

  readonly admissionDate = computed(() => {
    const ad = this.currentEnrollment();
    return ad?.submitted_at ?? ad?.created_at ?? this.alumno()?.created_at ?? null;
  });

  readonly matriculaInfo = computed(() => {
    const ad = this.currentEnrollment();
    return ad?.form_data?.matricula ?? {};
  });

  readonly paymentStateLabelKey = computed(() => {
    const p = this.payments();
    if (!p) return 'studentDetail.summary.onTrack';
    if (p.state === 'overdue') return 'studentDetail.summary.overdue';
    if (p.state === 'pending') return 'studentDetail.summary.pendingPay';
    return 'studentDetail.summary.onTrack';
  });

  readonly paymentStateTone = computed<'green' | 'mustard' | 'coral'>(() => {
    const p = this.payments();
    if (!p) return 'green';
    if (p.state === 'overdue') return 'coral';
    if (p.state === 'pending') return 'mustard';
    return 'green';
  });

  readonly recentActivity = computed<ActivityEvent[]>(() => {
    const events: ActivityEvent[] = [];

    const att = this.attendance();
    if (att) {
      const recent = [...att.recent].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 3);
      for (const a of recent) {
        events.push({
          id: `att-${a.id}`,
          type: 'attendance',
          date: a.created_at ?? `${a.fecha}T08:00:00`,
          titleKey: a.estado === 'presente'
            ? 'studentDetail.activity.attendancePresent'
            : a.estado === 'tarde'
              ? 'studentDetail.activity.attendanceLate'
              : a.estado === 'justificado'
                ? 'studentDetail.activity.attendanceJustified'
                : 'studentDetail.activity.attendanceAbsent',
          detail: a.nota || this.attendanceStatusLabel(a.estado),
          color: a.estado === 'ausente' ? 'coral' : a.estado === 'tarde' ? 'mustard' : 'green',
          icon: 'attendance',
        });
      }
    }

    const adms = this.admissions();
    for (const ad of adms.slice(0, 2)) {
      events.push({
        id: `adm-${ad.id}`,
        type: 'admission',
        date: ad.submitted_at ?? ad.updated_at ?? ad.created_at ?? new Date().toISOString(),
        titleKey: ad.status === 'admitted'
          ? 'studentDetail.activity.admissionAdmitted'
          : ad.status === 'submitted'
            ? 'studentDetail.activity.admissionSubmitted'
            : 'studentDetail.activity.admissionUpdated',
        titleParams: { year: ad.anio_escolar },
        detail: ad.nivel_solicitado || '',
        color: 'sky',
        icon: 'admission',
      });
    }

    const pay = this.payments();
    if (pay) {
      const lastPaid = pay.cuotas
        .filter((c) => c.status === 'cobrada' || c.status === 'pagada_manual')
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
      if (lastPaid) {
        events.push({
          id: `pay-${lastPaid.id}`,
          type: 'payment',
          date: lastPaid.updated_at,
          titleKey: 'studentDetail.activity.paymentReceived',
          titleParams: { period: lastPaid.periodo },
          detail: `${lastPaid.importe_final.toFixed(2)} €`,
          color: 'green',
          icon: 'payment',
        });
      }

      const overdue = pay.cuotas.find((c) => c.status === 'devuelta');
      if (overdue) {
        events.push({
          id: `pay-back-${overdue.id}`,
          type: 'payment',
          date: overdue.updated_at,
          titleKey: 'studentDetail.activity.paymentReturned',
          titleParams: { period: overdue.periodo },
          detail: `${overdue.importe_final.toFixed(2)} €`,
          color: 'coral',
          icon: 'payment',
        });
      }
    }

    const a = this.alumno();
    if (a?.created_at) {
      events.push({
        id: 'alm-created',
        type: 'tutor',
        date: a.created_at,
        titleKey: 'studentDetail.activity.recordCreated',
        detail: '',
        color: 'purple',
        icon: 'tutor',
      });
    }

    return events
      .sort((x, y) => y.date.localeCompare(x.date))
      .slice(0, 6);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/a/alumnos']);
      return;
    }
    this.fetch(id);
  }

  fetch(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.studentsService.getById(id).subscribe({
      next: (a) => {
        this.alumno.set(a);
        this.form.patchValue({
          nombre: a.nombre ?? '',
          apellidos: a.apellidos ?? '',
          nivel: a.nivel ?? '',
          aula: a.aula ?? '',
          fecha_nacimiento: a.fecha_nacimiento ?? '',
          genero: (a.genero ?? '') as '' | 'M' | 'F' | 'X',
          email: a.email ?? '',
          telefono: a.telefono ?? '',
        });
        this.loading.set(false);
        this.loadAttendanceSummary(a.id);
        this.loadPaymentsSummary(a.id);
        this.loadAdmissions(a.id);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(this.parseError(err));
      },
    });
  }

  private loadAttendanceSummary(id: string): void {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 30);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    this.attendanceService.listForAlumno(id, fmt(from), fmt(today)).subscribe({
      next: (resp) => {
        const items = resp?.data ?? [];
        if (items.length === 0) { this.attendance.set(null); return; }

        const count = (estado: AsistenciaEstado): number => items.filter((i) => i.estado === estado).length;
        const present   = count('presente');
        const late      = count('tarde');
        const absent    = count('ausente');
        const justified = count('justificado');
        const total     = items.length;
        const percent   = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

        const sorted = [...items].sort((a, b) => a.fecha.localeCompare(b.fecha));
        const buckets = new Array(15).fill(0);
        const bucketSize = Math.max(1, Math.ceil(sorted.length / buckets.length));
        sorted.forEach((it, i) => {
          const b = Math.min(buckets.length - 1, Math.floor(i / bucketSize));
          if (it.estado === 'presente' || it.estado === 'tarde') buckets[b] += 1;
        });

        this.attendance.set({
          percent, present, absent, late, justified,
          series: buckets,
          recent: sorted.slice(-15).reverse(),
        });
      },
      error: () => this.attendance.set(null),
    });
  }

  private loadPaymentsSummary(id: string): void {
    this.billingService.listCuotas({ alumno_id: id }).subscribe({
      next: (resp) => {
        const raw = resp?.data ?? [];
        if (raw.length === 0) { this.payments.set(null); return; }

        // Backend returns Decimal as string ("350.00"); coerce to number so
        // arithmetic and the |number pipe behave correctly.
        const toNum = (v: unknown): number => {
          const n = typeof v === 'number' ? v : parseFloat(String(v ?? 0));
          return Number.isFinite(n) ? n : 0;
        };
        const items: Cuota[] = raw.map((c) => ({
          ...c,
          importe_base:  toNum(c.importe_base),
          descuento_pct: toNum(c.descuento_pct),
          importe_final: toNum(c.importe_final),
        }));

        const total      = items.length;
        const paidItems  = items.filter((c) => c.status === 'cobrada' || c.status === 'pagada_manual');
        const paid       = paidItems.length;
        const totalPaid  = paidItems.reduce((sum, c) => sum + c.importe_final, 0);
        const pendingItems = items.filter((c) => c.status === 'pendiente' || c.status === 'en_remesa');
        const totalPending = pendingItems.reduce((sum, c) => sum + c.importe_final, 0);
        const monthly    = items[0]?.importe_final ?? null;
        const nextDue    = pendingItems
          .map((c) => c.vencimiento)
          .sort()[0] ?? null;

        // Past-due if any cuota was returned by the bank or any pending one
        // is past its vencimiento date.
        const today = new Date().toISOString().slice(0, 10);
        const hasReturned = items.some((c) => c.status === 'devuelta');
        const hasPastDue  = pendingItems.some((c) => c.vencimiento < today);
        const state: PaymentSummary['state'] = (hasReturned || hasPastDue) ? 'overdue' : 'on_track';

        const sorted = [...items].sort((a, b) => b.vencimiento.localeCompare(a.vencimiento));

        this.payments.set({
          monthly,
          paid,
          total,
          totalPaid,
          totalPending,
          state,
          nextDue,
          cuotas: sorted,
        });
      },
      error: () => this.payments.set(null),
    });
  }

  private loadAdmissions(alumnoId: string): void {
    this.admissionsService.listByAlumno(alumnoId).subscribe({
      next: (resp) => {
        const items = (resp?.items ?? resp?.data ?? resp?.results ?? []) as Admission[];
        const sorted = [...items].sort((a, b) =>
          (b.submitted_at ?? b.created_at ?? '').localeCompare(a.submitted_at ?? a.created_at ?? '')
        );
        this.admissions.set(sorted);
      },
      error: () => this.admissions.set([]),
    });
  }

  setTab(tab: TabKey): void {
    this.currentTab.set(tab);
    if (tab !== 'personal' && this.editMode()) {
      this.cancelEdit();
    }
  }

  enterEdit(): void {
    this.editMode.set(true);
    this.currentTab.set('personal');
    this.moreMenuOpen.set(false);
  }

  // ── "More actions" dropdown handlers ─────────────────────────────────
  duplicateStudent(): void {
    this.moreMenuOpen.set(false);
    const a = this.alumno();
    if (!a) return;
    alert(`Duplicar "${a.nombre_completo ?? `${a.nombre} ${a.apellidos}`}"\n\nEn la versió real obriria el formulari de creació amb tots els camps prerellenats excepte el nom.`);
  }

  exportData(): void {
    this.moreMenuOpen.set(false);
    const a = this.alumno();
    if (!a) return;
    const payload = JSON.stringify(a, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alumne-${a.id}.json`;
    document.body.appendChild(link); link.click(); link.remove();
    URL.revokeObjectURL(url);
  }

  printDetail(): void {
    this.moreMenuOpen.set(false);
    window.print();
  }

  archiveStudent(): void {
    this.moreMenuOpen.set(false);
    const a = this.alumno();
    if (!a) return;
    const ok = window.confirm(`Vols arxivar "${a.nombre_completo ?? `${a.nombre} ${a.apellidos}`}"?\n\nL'alumne quedarà fora del llistat actiu però recuperable des de l'historial.`);
    if (!ok) return;
    this.router.navigate(['/a/alumnos']);
  }

  cancelEdit(): void {
    this.editMode.set(false);
    const a = this.alumno();
    if (a) {
      this.form.patchValue({
        nombre: a.nombre ?? '',
        apellidos: a.apellidos ?? '',
        nivel: a.nivel ?? '',
        aula: a.aula ?? '',
        fecha_nacimiento: a.fecha_nacimiento ?? '',
        genero: (a.genero ?? '') as '' | 'M' | 'F' | 'X',
        email: a.email ?? '',
        telefono: a.telefono ?? '',
      });
    }
  }

  save(): void {
    const a = this.alumno();
    if (!a || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const payload: Partial<Alumno> = {
      nombre: raw.nombre,
      apellidos: raw.apellidos,
      nivel: raw.nivel || null,
      aula: raw.aula || null,
      fecha_nacimiento: raw.fecha_nacimiento || null,
      genero: raw.genero === '' ? null : raw.genero,
      email: raw.email || null,
      telefono: raw.telefono || null,
    };
    this.studentsService.update(a.id, payload).subscribe({
      next: (updated) => {
        this.alumno.set(updated);
        this.saving.set(false);
        this.editMode.set(false);
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.error.set(this.parseError(err));
      },
    });
  }

  startAdmission(): void {
    const a = this.alumno();
    if (!a) return;
    this.router.navigate(['/a/admissions/new'], { queryParams: { alumno: a.id } });
  }

  contactFamily(): void {
    const tutor = this.mainTutor();
    if (tutor?.email) {
      window.location.href = `mailto:${tutor.email}`;
    }
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString(this.transloco.getActiveLang(), {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString(this.transloco.getActiveLang(), {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  }

  /** "Avui 09:15", "Ahir 15:30", or "DD MMM HH:mm" for older. */
  formatRelativeDateTime(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    const time = d.toLocaleTimeString(this.transloco.getActiveLang(), {
      hour: '2-digit', minute: '2-digit',
    });

    if (sameDay(d, today))     return `${this.transloco.translate('studentDetail.relativeDate.today')} ${time}`;
    if (sameDay(d, yesterday)) return `${this.transloco.translate('studentDetail.relativeDate.yesterday')} ${time}`;
    if (sameDay(d, tomorrow))  return `${this.transloco.translate('studentDetail.relativeDate.tomorrow')} ${time}`;

    return d.toLocaleString(this.transloco.getActiveLang(), {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  }

  formatTutorRole(t: Tutor): string {
    const key = `studentDetail.parentesco.${t.parentesco ?? 'tutor'}`;
    const translated = this.transloco.translate(key);
    if (translated && translated !== key) return translated;
    return (t.parentesco ?? 'tutor').toString();
  }

  formatCuotaStatus(c: Cuota): string {
    return this.transloco.translate(`studentDetail.cuotaStatus.${c.status}`);
  }

  cuotaStatusTone(c: Cuota): 'green' | 'mustard' | 'coral' | 'sky' | 'navy' {
    switch (c.status) {
      case 'cobrada':
      case 'pagada_manual': return 'green';
      case 'pendiente':     return 'mustard';
      case 'en_remesa':     return 'sky';
      case 'devuelta':      return 'coral';
      default:              return 'navy';
    }
  }

  attendanceStatusLabel(estado: AsistenciaEstado): string {
    return this.transloco.translate(`studentDetail.attendanceState.${estado}`);
  }

  attendanceStatusTone(estado: AsistenciaEstado): 'green' | 'mustard' | 'coral' | 'sky' {
    switch (estado) {
      case 'presente':    return 'green';
      case 'tarde':       return 'mustard';
      case 'ausente':     return 'coral';
      case 'justificado': return 'sky';
    }
  }

  admissionStatusLabel(s: string): string {
    return this.transloco.translate(`studentDetail.admissionState.${s}`);
  }

  consentLabel(value: unknown): string {
    if (value === true || value === 'si')   return this.transloco.translate('studentDetail.consent.yes');
    if (value === false || value === 'no')  return this.transloco.translate('studentDetail.consent.no');
    return this.transloco.translate('studentDetail.consent.pending');
  }

  consentTone(value: unknown): 'green' | 'coral' | 'mustard' {
    if (value === true || value === 'si')  return 'green';
    if (value === false || value === 'no') return 'coral';
    return 'mustard';
  }

  private normalizeMedical(payload: DatosMedicosPayload | null, legacy: MedicalInfo | null): NormalizedMedical {
    const joinList = (v: string[] | null | undefined): string => (v ?? []).filter(Boolean).join(', ');

    const alergias    = payload?.alergias != null   ? joinList(payload.alergias)    : (legacy?.alergias ?? '');
    const medicacion  = payload?.medicacion != null ? joinList(payload.medicacion)  : (legacy?.medicacion ?? '');
    const condiciones = payload?.condiciones != null ? joinList(payload.condiciones) : '';
    const grupo       = payload?.grupo_sanguineo ?? legacy?.grupo_sanguineo ?? '';
    const medico      = payload?.medico_nombre ?? legacy?.medico ?? '';
    const medicoTel   = payload?.medico_tel ?? '';
    const notas       = payload?.notas ?? legacy?.notas ?? '';

    const normalizedAlergias = alergias.trim().toLowerCase();
    const hasAllergies = normalizedAlergias.length > 0
      && !['cap', 'ninguna', 'none', '—', '-'].includes(normalizedAlergias);

    const isEmpty = !alergias && !medicacion && !condiciones && !grupo && !medico && !medicoTel && !notas;

    return {
      alergias: alergias || '',
      medicacion: medicacion || '',
      condiciones: condiciones || '',
      grupo_sanguineo: grupo,
      medico_nombre: medico,
      medico_tel: medicoTel,
      notas,
      hasAllergies,
      isEmpty,
    };
  }

  private parseError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 404) return this.transloco.translate('studentDetail.errors.notFound');
      if (err.status === 0)   return this.transloco.translate('studentDetail.errors.offline');
    }
    return this.transloco.translate('studentDetail.errors.generic');
  }
}
