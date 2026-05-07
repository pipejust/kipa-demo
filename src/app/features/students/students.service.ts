import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../core/api/api.service';
import { Alumno, AlumnoListResponse } from '../../shared/models/alumno.model';

export interface StudentsListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class StudentsService {
  private readonly api = inject(ApiService);

  list(query: StudentsListQuery = {}): Observable<AlumnoListResponse> {
    return this.api.get<AlumnoListResponse>('/alumnos', {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      search: query.search ?? '',
      status: query.status ?? '',
    });
  }

  getById(id: string): Observable<Alumno> {
    return this.api.get<Alumno>(`/alumnos/${id}`);
  }

  create(payload: Partial<Alumno>): Observable<Alumno> {
    return this.api.post<Alumno>('/alumnos', payload);
  }

  update(id: string, payload: Partial<Alumno>): Observable<Alumno> {
    return this.api.patch<Alumno>(`/alumnos/${id}`, payload);
  }
}
