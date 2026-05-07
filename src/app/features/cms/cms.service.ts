/**
 * CMS service — reads and writes tenant content entries.
 *
 * Content entries are named text blocks that admins can edit
 * from the UI without a code deployment. Common keys:
 *   home.welcome, home.description, admission.cta, footer.text …
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = '/api/v1/cms';

export interface ContentEntry {
  id: string;
  tenant_id: string;
  key: string;
  value: string;
  updated_at: string;
  updated_by: string | null;
}

export interface ContentListResponse {
  data: ContentEntry[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class CmsService {
  private readonly http = inject(HttpClient);

  listAll(): Observable<ContentListResponse> {
    return this.http.get<ContentListResponse>(API);
  }

  get(key: string): Observable<ContentEntry> {
    return this.http.get<ContentEntry>(`${API}/${key}`);
  }

  upsert(key: string, value: string): Observable<ContentEntry> {
    return this.http.put<ContentEntry>(`${API}/${key}`, { value });
  }

  delete(key: string): Observable<void> {
    return this.http.delete<void>(`${API}/${key}`);
  }
}
