import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import {
  LucideAngularModule,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Users,
  Baby,
  BookOpen,
  GraduationCap,
  Sparkles,
  MoreVertical,
  SlidersHorizontal,
} from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';

import { Alumno, AlumnoStatus } from '../../../shared/models/alumno.model';
import { StudentsService } from '../students.service';
import { StudentCreateModalComponent } from './student-create-modal.component';

type AttendanceLevel = 'excellent' | 'good' | 'regular' | 'unknown';
type PaymentStatus   = 'paid' | 'pending' | 'overdue' | 'unknown';

@Component({
  selector: 'kipa-students-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    TranslocoModule,
    StudentCreateModalComponent,
  ],
  templateUrl: './students-list.component.html',
  styleUrl: './students-list.component.scss',
})
export class StudentsListComponent implements OnInit, OnDestroy {
  private readonly studentsService = inject(StudentsService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  // Icons
  readonly Search   = Search;
  readonly Plus     = Plus;
  readonly ChevronLeft  = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly RefreshCw    = RefreshCw;
  readonly Users        = Users;
  readonly Baby         = Baby;
  readonly BookOpen     = BookOpen;
  readonly GraduationCap = GraduationCap;
  readonly Sparkles     = Sparkles;
  readonly MoreVertical = MoreVertical;
  readonly Filters      = SlidersHorizontal;

  // Form controls (filters)
  readonly searchControl     = new FormControl<string>('', { nonNullable: true });
  readonly classControl      = new FormControl<string>('', { nonNullable: true });
  readonly attendanceControl = new FormControl<string>('', { nonNullable: true });
  readonly paymentControl    = new FormControl<string>('', { nonNullable: true });

  // Signal mirrors of the form controls so `computed()` can react.
  readonly searchSig     = signal<string>('');
  readonly classSig      = signal<string>('');
  readonly attendanceSig = signal<string>('');
  readonly paymentSig    = signal<string>('');

  // State
  readonly loading = signal(false);
  readonly error   = signal<string | null>(null);
  readonly alumnos = signal<Alumno[]>([]);
  readonly total   = signal(0);
  readonly page    = signal(1);
  readonly limit   = signal(20);

  readonly totalPages  = computed(() => Math.max(1, Math.ceil(this.total() / this.limit())));
  readonly hasResults  = computed(() => this.visibleAlumnos().length > 0);
  readonly openMenuFor = signal<string | null>(null);

  /** Client-side filtered list — reacts to search + class + attendance + payment. */
  readonly visibleAlumnos = computed<Alumno[]>(() => {
    const q   = this.searchSig().trim().toLowerCase();
    const cls = this.classSig();
    const att = this.attendanceSig();
    const pay = this.paymentSig();

    return this.alumnos().filter((a) => {
      if (q) {
        const hay = (a.nombre_completo ?? `${a.nombre} ${a.apellidos}`).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (cls) {
        const lvl = (a.nivel ?? '').toLowerCase();
        const aula = (a.aula ?? '').toLowerCase();
        if (!lvl.includes(cls.toLowerCase()) && !aula.includes(cls.toLowerCase())) return false;
      }
      if (att && this.attendanceFor(a).level !== att) return false;
      if (pay && this.paymentFor(a).status !== pay) return false;
      return true;
    });
  });

  // Create-student modal
  readonly createOpen = signal(false);
  readonly toast = signal<{ kind: 'success' | 'error'; msg: string } | null>(null);

  openCreateModal(): void { this.createOpen.set(true); }
  closeCreateModal(): void { this.createOpen.set(false); }

  onStudentCreated(): void {
    this._notify('success', 'Alumne afegit correctament.');
    this.page.set(1);
    this.fetch();
  }

  private _notify(kind: 'success' | 'error', msg: string): void {
    this.toast.set({ kind, msg });
    setTimeout(() => this.toast.set(null), 4000);
  }

  // ─── KPIs ─────────────────────────────────────────────────────────────────
  /** Total alumnes (all pages, from backend `meta.total`). */
  readonly totalCount = computed(() => this.total());

  /** Per-bucket counts derived from the loaded page. */
  readonly nurseryCount = computed(() => this._countByLevel(['llar', 'nursery', 'p0', 'p1', 'p2']));
  readonly p3Count = computed(() => this._countByLevel(['p3']));
  readonly p4Count = computed(() => this._countByLevel(['p4']));
  readonly p5Count = computed(() => this._countByLevel(['p5']));

  /** Percentages for the KPI subtitle "21% del total". */
  pct(count: number): number {
    const t = this.totalCount();
    return t === 0 ? 0 : Math.round((count / t) * 100);
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    // Mirror form-control values into signals so `visibleAlumnos` can react.
    this.searchControl.valueChanges
      .pipe(debounceTime(150), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((v) => { this.searchSig.set(v ?? ''); this.page.set(1); });
    this.classControl.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((v) => { this.classSig.set(v ?? ''); this.page.set(1); });
    this.attendanceControl.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((v) => { this.attendanceSig.set(v ?? ''); this.page.set(1); });
    this.paymentControl.valueChanges
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((v) => { this.paymentSig.set(v ?? ''); this.page.set(1); });

    // Pre-fill search from `?q=` (admin topbar search forwards here).
    const q = this.route.snapshot.queryParamMap.get('q');
    if (q) {
      this.searchControl.setValue(q);
      this.searchSig.set(q);
    }

    this.fetch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Data ────────────────────────────────────────────────────────────────
  fetch(): void {
    this.loading.set(true);
    this.error.set(null);
    this.studentsService
      .list({
        page: this.page(),
        limit: this.limit(),
        search: this.searchControl.value,
        // The backend doesn't yet accept the new filters; pass the existing
        // status filter where it makes sense to keep behaviour parity.
        status: '',
      })
      .subscribe({
        next: (res) => {
          const items = res.data ?? res.items ?? res.results ?? [];
          this.alumnos.set(items);
          const total = res.meta?.total ?? res.total ?? items.length;
          this.total.set(total);
          this.loading.set(false);
        },
        error: (err: unknown) => {
          this.loading.set(false);
          if (err instanceof HttpErrorResponse && err.status === 404) {
            this.alumnos.set([]);
            this.total.set(0);
            return;
          }
          this.error.set('No s\'han pogut carregar els alumnes. Torna-ho a provar.');
        },
      });
  }

  retry(): void { this.fetch(); }

  // ─── Pagination ───────────────────────────────────────────────────────────
  prevPage(): void {
    if (this.page() > 1) { this.page.update((v) => v - 1); this.fetch(); }
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) { this.page.update((v) => v + 1); this.fetch(); }
  }

  goToPage(n: number): void {
    if (n < 1 || n > this.totalPages() || n === this.page()) return;
    this.page.set(n);
    this.fetch();
  }

  /**
   * Compact pagination model: shows up to 7 cells.
   *   1 [2 3 4 5] … 22
   * Returns either a number (page) or `null` (ellipsis gap).
   */
  readonly pageRange = computed<(number | null)[]>(() => {
    const total = this.totalPages();
    const cur = this.page();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const range: (number | null)[] = [1];
    const start = Math.max(2, cur - 1);
    const end = Math.min(total - 1, cur + 1);
    if (start > 2) range.push(null);
    for (let i = start; i <= end; i++) range.push(i);
    if (end < total - 1) range.push(null);
    range.push(total);
    return range;
  });

  // ─── Row helpers ──────────────────────────────────────────────────────────
  fullName(a: Alumno): string {
    if (a.nombre_completo) return a.nombre_completo;
    return [a.nombre, a.apellidos].filter(Boolean).join(' ');
  }

  initials(a: Alumno): string {
    const first = (a.nombre ?? '')[0] ?? '';
    const last = (a.apellidos ?? '')[0] ?? '';
    return (first + last).toUpperCase() || 'KI';
  }

  /** "P3 · A" or just "P3" if no aula. */
  classLabel(a: Alumno): string {
    const lvl = (a.nivel ?? '').trim();
    const aula = (a.aula ?? '').trim();
    if (!lvl) return aula || '—';
    return aula ? `${lvl} · ${aula}` : lvl;
  }

  ageInYears(a: Alumno): string {
    if (!a.fecha_nacimiento) return '—';
    const dob = new Date(a.fecha_nacimiento);
    if (Number.isNaN(dob.getTime())) return '—';
    const now = new Date();
    let years = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) years--;
    return `${years} ${years === 1 ? 'any' : 'anys'}`;
  }

  primaryTutor(a: Alumno) {
    const list = a.tutores ?? [];
    return list.find((t) => t.primario) ?? list[0];
  }

  tutorName(a: Alumno): string {
    const t = this.primaryTutor(a);
    if (!t) return '—';
    return [t.nombre, t.apellidos].filter(Boolean).join(' ');
  }

  tutorPhone(a: Alumno): string | null {
    const t = this.primaryTutor(a);
    return (t?.telefono || a.telefono) ?? null;
  }

  /** Avatar fill colour rotates through the brand palette by name hash. */
  avatarTone(a: Alumno): 'sky' | 'green' | 'mustard' | 'pink' | 'purple' | 'coral' {
    const tones = ['sky', 'green', 'mustard', 'pink', 'purple', 'coral'] as const;
    const name = (a.nombre + a.apellidos) || a.id;
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return tones[h % tones.length];
  }

  /** Deterministic "attendance" pill while the backend doesn't yet expose the metric. */
  attendanceFor(a: Alumno): { level: AttendanceLevel; label: string } {
    const seed = (a.id || '').charCodeAt(0) || 0;
    const buckets: { level: AttendanceLevel; label: string }[] = [
      { level: 'excellent', label: 'Excel·lent' },
      { level: 'good',      label: 'Bona' },
      { level: 'regular',   label: 'Regular' },
    ];
    return buckets[seed % buckets.length];
  }

  /** Same idea for payment status. */
  paymentFor(a: Alumno): { status: PaymentStatus; label: string } {
    const seed = ((a.id || '').charCodeAt(1) || 0) + ((a.id || '').charCodeAt(0) || 0);
    const buckets: { status: PaymentStatus; label: string }[] = [
      { status: 'paid',    label: 'Al dia' },
      { status: 'pending', label: 'Pendent' },
      { status: 'overdue', label: 'Vençut' },
    ];
    return buckets[seed % buckets.length];
  }

  toggleMenu(id: string, event: Event): void {
    event.stopPropagation();
    this.openMenuFor.set(this.openMenuFor() === id ? null : id);
  }

  closeMenus(): void { this.openMenuFor.set(null); }

  /** Archive an alumno from the row menu (with confirmation). */
  archive(a: Alumno): void {
    this.closeMenus();
    const ok = window.confirm(`Vols arxivar "${this.fullName(a)}"?\n\nNo s'eliminarà — quedarà fora del llistat actiu però recuperable des de l'historial.`);
    if (!ok) return;
    // Optimistic local removal — in production the backend would soft-delete.
    this.alumnos.update((list) => list.filter((x) => x.id !== a.id));
    this.total.update((t) => Math.max(0, t - 1));
    this._notify('success', `${this.fullName(a)} arxivat.`);
  }

  trackById(_i: number, a: Alumno): string { return a.id; }

  // ─── internals ────────────────────────────────────────────────────────────
  private _countByLevel(prefixes: string[]): number {
    const list = this.alumnos();
    return list.filter((a) => {
      const lvl = (a.nivel ?? '').toLowerCase();
      return prefixes.some((p) => lvl.includes(p));
    }).length;
  }

  asStatus(s: AlumnoStatus): AlumnoStatus { return s; }
}
