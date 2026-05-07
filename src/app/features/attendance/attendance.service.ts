import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import type { AsistenciaEstado, AsistenciaListResponse, AsistenciaOut } from '../../core/api/types.gen';

const API = '/api/v1/attendance';

export interface AsistenciaUpsertRequest {
  alumno_id: string;
  fecha: string; // YYYY-MM-DD
  estado: AsistenciaEstado;
  nota?: string;
}

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private readonly http = inject(HttpClient);

  listForDate(fecha: string): Observable<AsistenciaListResponse> {
    return this.http.get<AsistenciaListResponse>(API, { params: { fecha } });
  }

  upsert(data: AsistenciaUpsertRequest): Observable<AsistenciaOut> {
    return this.http.put<AsistenciaOut>(API, data);
  }

  listForAlumno(alumnoId: string, desde: string, hasta: string): Observable<AsistenciaListResponse> {
    const params = new HttpParams().set('desde', desde).set('hasta', hasta);
    return this.http.get<AsistenciaListResponse>(`${API}/alumno/${alumnoId}`, { params });
  }
}
