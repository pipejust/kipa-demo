/**
 * NotificationsApiService — talks to /api/v1/notifications/...
 *
 * The bell dropdown (admin-shell), the full inbox (/a/notifications) and
 * the broadcast modal all share this single service.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = '/api/v1/notifications';

// ─── Types (mirror backend schemas) ──────────────────────────────────────────

export type NotificationKind =
  | 'admission'
  | 'message'
  | 'payment'
  | 'attendance'
  | 'announcement'
  | 'system';

export interface NotificationOut {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  link: string | null;
  resource_type: string | null;
  resource_id: string | null;
  actor_id: string | null;
  extra: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface NotificationListOut {
  items: NotificationOut[];
  total: number;
  unread: number;
}

export interface UnreadCountOut {
  unread: number;
}

export type BroadcastScope =
  | 'all'
  | 'admins'
  | 'secretaries'
  | 'teachers'
  | 'families'
  | 'user';

export interface BroadcastIn {
  title: string;
  body?: string;
  link?: string | null;
  kind?: NotificationKind;
  scope?: BroadcastScope;
  user_id?: string | null;
}

export interface BroadcastOut {
  created: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationsApiService {
  private readonly http = inject(HttpClient);

  list(opts: { limit?: number; onlyUnread?: boolean } = {}): Observable<NotificationListOut> {
    const params: Record<string, string> = {};
    if (opts.limit) params['limit'] = String(opts.limit);
    if (opts.onlyUnread) params['only_unread'] = 'true';
    return this.http.get<NotificationListOut>(`${API}/me`, { params });
  }

  unreadCount(): Observable<UnreadCountOut> {
    return this.http.get<UnreadCountOut>(`${API}/me/unread-count`);
  }

  markRead(id: string): Observable<NotificationOut> {
    return this.http.post<NotificationOut>(`${API}/me/${id}/read`, {});
  }

  markAllRead(): Observable<UnreadCountOut> {
    return this.http.post<UnreadCountOut>(`${API}/me/read-all`, {});
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/me/${id}`);
  }

  broadcast(payload: BroadcastIn): Observable<BroadcastOut> {
    return this.http.post<BroadcastOut>(`${API}/broadcast`, payload);
  }
}
