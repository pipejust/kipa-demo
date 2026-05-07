/**
 * KPI service — fetches F5 dashboard metrics from the backend.
 *
 * All materialized-view data is read-only on the frontend;
 * the nightly Celery Beat task (tasks_kpi) refreshes the views.
 * The `refresh()` method lets admins trigger a manual refresh.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = '/api/v1/kpis';

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface KpiSummary {
  tenant_id: string;
  tenant_name: string;
  // Financial
  total_cobrado: number;
  total_pendiente: number;
  tasa_morosidad_pct: number;
  // Enrollment
  matriculados: number;
  total_alumnos: number;
  // Captació
  solicitudes_total: number;
  tasa_conversion_pct: number;
  // Attendance
  tasa_asistencia_pct: number;
  // NPS
  nps_score: number;
  nps_promedio: number;
  refreshed_at: string | null;
}

export interface KpiFinanciero {
  tenant_id: string;
  total_cuotas: number;
  total_cobrado: number;
  total_pendiente: number;
  total_devuelto: number;
  tasa_morosidad_pct: number;
}

export interface KpiOcupacio {
  tenant_id: string;
  matriculados: number;
  activos: number;
  total_alumnos: number;
}

export interface KpiCaptacio {
  tenant_id: string;
  solicitudes_total: number;
  aceptadas: number;
  matriculades: number;
  rechazadas: number;
  tasa_conversion_pct: number;
}

export interface KpiAsistencia {
  tenant_id: string;
  total_registros: number;
  presentes: number;
  ausentes: number;
  otros: number;
  tasa_asistencia_pct: number;
}

export interface KpiNps {
  tenant_id: string;
  total_respuestas: number;
  promedio: number;
  promotores: number;
  pasivos: number;
  detractores: number;
  nps_score: number;
}

export type RefreshResult = Record<string, string>;


// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class KpiService {
  private readonly http = inject(HttpClient);

  getSummary(): Observable<KpiSummary> {
    return this.http.get<KpiSummary>(`${API}/summary`);
  }

  getFinanciero(): Observable<KpiFinanciero> {
    return this.http.get<KpiFinanciero>(`${API}/financiero`);
  }

  getOcupacio(): Observable<KpiOcupacio> {
    return this.http.get<KpiOcupacio>(`${API}/ocupacion`);
  }

  getCaptacio(): Observable<KpiCaptacio> {
    return this.http.get<KpiCaptacio>(`${API}/captacion`);
  }

  getAsistencia(): Observable<KpiAsistencia> {
    return this.http.get<KpiAsistencia>(`${API}/asistencia`);
  }

  getNps(): Observable<KpiNps> {
    return this.http.get<KpiNps>(`${API}/nps`);
  }

  /** Admin-only: trigger a manual REFRESH CONCURRENTLY on all KPI views. */
  refresh(): Observable<RefreshResult> {
    return this.http.post<RefreshResult>(`${API}/refresh`, {});
  }
}
