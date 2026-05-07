import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import type {
  CampaignCreate,
  CampaignListResponse,
  CampaignOut,
  Channel,
  MessageListResponse,
  PreferenceOut,
  PreferenceUpsert,
  SendCampaignRequest,
  TemplateCreate,
  TemplateListResponse,
  TemplateOut,
} from '../../core/api/types.gen';

const API = '/api/v1/communications';

@Injectable({ providedIn: 'root' })
export class CommunicationsService {
  private readonly http = inject(HttpClient);

  // ─── Templates ────────────────────────────────────────────────────────────

  listTemplates(): Observable<TemplateListResponse> {
    return this.http.get<TemplateListResponse>(`${API}/templates`);
  }

  createTemplate(data: TemplateCreate): Observable<TemplateOut> {
    return this.http.post<TemplateOut>(`${API}/templates`, data);
  }

  getTemplate(id: string): Observable<TemplateOut> {
    return this.http.get<TemplateOut>(`${API}/templates/${id}`);
  }

  // ─── Campaigns ────────────────────────────────────────────────────────────

  listCampaigns(): Observable<CampaignListResponse> {
    return this.http.get<CampaignListResponse>(`${API}/campaigns`);
  }

  createCampaign(data: CampaignCreate): Observable<CampaignOut> {
    return this.http.post<CampaignOut>(`${API}/campaigns`, data);
  }

  getCampaign(id: string): Observable<CampaignOut> {
    return this.http.get<CampaignOut>(`${API}/campaigns/${id}`);
  }

  sendCampaign(id: string): Observable<CampaignOut> {
    const body: SendCampaignRequest = { send_now: true };
    return this.http.post<CampaignOut>(`${API}/campaigns/${id}/send`, body);
  }

  listMessages(campaignId: string): Observable<MessageListResponse> {
    return this.http.get<MessageListResponse>(`${API}/campaigns/${campaignId}/messages`);
  }

  // ─── Preferences ──────────────────────────────────────────────────────────

  getPreferences(alumnoId: string): Observable<PreferenceOut[]> {
    return this.http.get<PreferenceOut[]>(`${API}/preferences/${alumnoId}`);
  }

  upsertPreference(alumnoId: string, channel: Channel, optIn: boolean): Observable<PreferenceOut> {
    const body: PreferenceUpsert = { channel, opt_in: optIn };
    return this.http.put<PreferenceOut>(`${API}/preferences/${alumnoId}`, body);
  }
}
