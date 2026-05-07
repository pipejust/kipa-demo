/**
 * Account service — talks to /api/v1/account/me/...
 *
 * Powers the Settings screen (general, notifications, security, appearance)
 * and the Profile screen's session info. The backend exposes:
 *
 *   GET    /me/preferences           load current prefs
 *   PATCH  /me/preferences           partial update by section
 *   POST   /me/password              change password (requires current)
 *   GET    /me/sessions              list active sessions
 *   DELETE /me/sessions/{id}         revoke one
 *   DELETE /me/sessions              revoke all except most recent
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = '/api/v1/account/me';

// ─── Types (mirror backend Pydantic schemas) ─────────────────────────────────

export type LanguageCode = 'ca' | 'es' | 'en';
export type DateFormat   = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type WeekStart    = 'monday' | 'sunday';
export type ThemeMode    = 'light' | 'dark' | 'system';

export interface GeneralPreferences {
  language: LanguageCode;
  timezone: string;
  date_format: DateFormat;
  week_start: WeekStart;
}

export interface NotificationPreferences {
  email_new: boolean;
  email_weekly: boolean;
  email_monthly: boolean;
  push_admissions: boolean;
  push_payments: boolean;
  push_messages: boolean;
  push_attendance: boolean;
}

export interface AppearancePreferences {
  theme: ThemeMode;
}

export interface UserPreferences {
  general: GeneralPreferences;
  notifications: NotificationPreferences;
  appearance: AppearancePreferences;
}

export type UserPreferencesPatch = Partial<{
  general: GeneralPreferences;
  notifications: NotificationPreferences;
  appearance: AppearancePreferences;
}>;

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export interface UserSession {
  id: string;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
  expires_at: string;
  is_current: boolean;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);

  /** Load all preferences for the current user (auto-defaults if missing). */
  getPreferences(): Observable<UserPreferences> {
    return this.http.get<UserPreferences>(`${API}/preferences`);
  }

  /**
   * Patch one or more sections of preferences.
   * Each section, if present, must be a complete valid object — the UI
   * always sends full sections after a "Save" click.
   */
  updatePreferences(patch: UserPreferencesPatch): Observable<UserPreferences> {
    return this.http.patch<UserPreferences>(`${API}/preferences`, patch);
  }

  /**
   * Change the current user's password. Backend returns 204 on success
   * or 400 with a translated error message on failure.
   */
  changePassword(payload: PasswordChangeRequest): Observable<void> {
    return this.http.post<void>(`${API}/password`, payload);
  }

  /** List the user's active (non-revoked, non-expired) sessions. */
  listSessions(): Observable<UserSession[]> {
    return this.http.get<UserSession[]>(`${API}/sessions`);
  }

  /** Revoke a specific session by id. */
  revokeSession(id: string): Observable<void> {
    return this.http.delete<void>(`${API}/sessions/${id}`);
  }

  /** Revoke every session except the most-recent (current browser). */
  revokeAllOtherSessions(): Observable<void> {
    return this.http.delete<void>(`${API}/sessions`);
  }
}
