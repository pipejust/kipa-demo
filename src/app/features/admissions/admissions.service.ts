import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';

import { ApiService } from '../../core/api/api.service';
import { Admission, AdmissionFormData } from '../../shared/models/admission.model';

export interface AdmissionsListQuery {
  page?: number;
  limit?: number;
  status?: string;
}

export interface AdmissionsListResponse {
  data?: Admission[];
  items?: Admission[];
  results?: Admission[];
  meta?: { total: number; page: number; limit: number };
  total?: number;
}

interface PresignResponse {
  upload_url: string;
  file_url: string;
  object_key: string;
  content_type: string;
  expires_in_seconds: number;
}

@Injectable({ providedIn: 'root' })
export class AdmissionsService {
  private readonly api  = inject(ApiService);
  private readonly http = inject(HttpClient);

  list(query: AdmissionsListQuery = {}): Observable<AdmissionsListResponse> {
    return this.api.get<AdmissionsListResponse>('/admissions', {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      status: query.status ?? '',
    });
  }

  listByAlumno(alumnoId: string): Observable<AdmissionsListResponse> {
    return this.api.get<AdmissionsListResponse>('/admissions', {
      page: 1,
      limit: 50,
      alumno_id: alumnoId,
    });
  }

  getById(id: string): Observable<Admission> {
    return this.api.get<Admission>(`/admissions/${id}`);
  }

  create(payload: { alumno_id: string; anio_escolar: string; nivel_solicitado: string }): Observable<Admission> {
    return this.api.post<Admission>('/admissions', payload);
  }

  update(id: string, payload: { current_step: number; form_data: AdmissionFormData }): Observable<Admission> {
    return this.api.patch<Admission>(`/admissions/${id}`, payload);
  }

  transition(id: string, payload: { new_status: string; reason?: string }): Observable<Admission> {
    return this.api.post<Admission>(`/admissions/${id}/transition`, payload);
  }

  /**
   * Upload a document directly to MinIO via a presigned PUT URL, then
   * register the file URL with the admission record.
   *
   * Flow:
   *   1. GET /admissions/{id}/documents/presign  → { upload_url, file_url }
   *   2. PUT file bytes to MinIO upload_url
   *   3. POST /admissions/{id}/documents with { doc_type, file_url }
   */
  uploadDocument(id: string, file: File, docType: string): Observable<Admission> {
    return this.api.get<PresignResponse>(`/admissions/${id}/documents/presign`, {
      filename: file.name,
      content_type: file.type || 'application/octet-stream',
    }).pipe(
      switchMap((presign) =>
        // PUT directly to MinIO — no KIPA auth header needed (presigned URL is self-contained)
        this.http.put(presign.upload_url, file, {
          headers: new HttpHeaders({ 'Content-Type': presign.content_type }),
          responseType: 'text',
        }).pipe(
          switchMap(() =>
            this.api.post<Admission>(`/admissions/${id}/documents`, {
              doc_type: docType,
              file_url: presign.file_url,
            }),
          ),
        ),
      ),
    );
  }

  generatePdf(id: string): Observable<{ url: string }> {
    return this.api.post<{ url: string }>(`/admissions/${id}/pdf`);
  }
}
