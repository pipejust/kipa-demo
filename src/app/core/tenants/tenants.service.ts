import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api/api.service';

/**
 * Public, anonymous-safe view of a tenant — only the fields needed
 * to render the centre selector on the login screen.
 *
 * Backed by `GET /api/v1/tenants/public`.
 */
export interface TenantPublic {
  slug: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class TenantsService {
  private readonly api = inject(ApiService);

  /** List active centres (no auth required). */
  listPublic(): Observable<TenantPublic[]> {
    return this.api.get<TenantPublic[]>('/tenants/public');
  }
}
