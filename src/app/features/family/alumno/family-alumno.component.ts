/**
 * FamilyAlumnoComponent — family-facing student detail.
 *
 * Three tabs:
 *   1. Assistència — last 30-day attendance history
 *   2. Informes    — quarterly report downloads
 *   3. Fotos       — daily photos with consent gate
 *
 * Route: /f/alumno/:id
 */
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  computed,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  CalendarCheck,
  FileText,
  Image,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download,
} from 'lucide-angular';

import { AttendanceService } from '../../attendance/attendance.service';
import type { AsistenciaOut } from '../../../core/api/types.gen';

type Tab = 'asistencia' | 'informes' | 'fotos';

interface Informe {
  id: string;
  alumno_id: string;
  periode: string;
  url: string | null;
  created_at: string;
}

interface Foto {
  id: string;
  alumno_id: string;
  url: string;
  caption: string | null;
  fecha: string;
}

@Component({
  selector: 'kipa-family-alumno',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, DatePipe],
  templateUrl: './family-alumno.component.html',
  styleUrl: './family-alumno.component.scss',
})
export class FamilyAlumnoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly attendanceSvc = inject(AttendanceService);

  readonly CalendarIcon = CalendarCheck;
  readonly FileTextIcon = FileText;
  readonly ImageIcon = Image;
  readonly ChevronLeftIcon = ChevronLeft;
  readonly CheckIcon = CheckCircle;
  readonly XIcon = XCircle;
  readonly ClockIcon = Clock;
  readonly AlertIcon = AlertCircle;
  readonly DownloadIcon = Download;

  readonly activeTab = signal<Tab>('asistencia');

  // ── Asistencia state ──
  readonly asistencia = signal<AsistenciaOut[]>([]);
  readonly asistenciaLoading = signal(true);

  readonly presencePct = computed(() => {
    const items = this.asistencia();
    if (!items.length) return 0;
    const presents = items.filter((i) => i.estado === 'presente').length;
    return Math.round((presents / items.length) * 100);
  });

  // ── Informes state ──
  readonly informes = signal<Informe[]>([]);
  readonly informesLoading = signal(false);
  private _informesLoaded = false;

  // ── Fotos state ──
  readonly fotos = signal<Foto[]>([]);
  readonly fotosLoading = signal(false);
  private _fotosLoaded = false;

  private get alumnoId(): string {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }

  ngOnInit(): void {
    this._loadAsistencia();
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
    if (tab === 'informes' && !this._informesLoaded) {
      this._loadInformes();
    }
    if (tab === 'fotos' && !this._fotosLoaded) {
      this._loadFotos();
    }
  }

  private _loadAsistencia(): void {
    const today = new Date();
    const hasta = today.toISOString().slice(0, 10);
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - 30);
    const desde = fromDate.toISOString().slice(0, 10);

    this.attendanceSvc.listForAlumno(this.alumnoId, desde, hasta).subscribe({
      next: (resp) => {
        this.asistencia.set(resp.data ?? []);
        this.asistenciaLoading.set(false);
      },
      error: () => {
        this.asistencia.set([]);
        this.asistenciaLoading.set(false);
      },
    });
  }

  private _loadInformes(): void {
    this._informesLoaded = true;
    this.informesLoading.set(true);
    this.http.get<{ data: Informe[]; total: number }>(
      `/api/v1/pedagogia/informes?alumno_id=${this.alumnoId}`
    ).subscribe({
      next: (resp) => {
        this.informes.set(resp.data ?? []);
        this.informesLoading.set(false);
      },
      error: () => {
        this.informes.set([]);
        this.informesLoading.set(false);
      },
    });
  }

  private _loadFotos(): void {
    this._fotosLoaded = true;
    this.fotosLoading.set(true);
    this.http.get<{ data: Foto[]; total: number }>(
      `/api/v1/pedagogia/fotos?alumno_id=${this.alumnoId}`
    ).subscribe({
      next: (resp) => {
        this.fotos.set(resp.data ?? []);
        this.fotosLoading.set(false);
      },
      error: () => {
        this.fotos.set([]);
        this.fotosLoading.set(false);
      },
    });
  }
}
