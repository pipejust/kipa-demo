import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../core/api/api.service';

// ── Models ────────────────────────────────────────────────────────────────────

export interface Tarifa {
  id: string;
  tenant_id: string;
  nombre: string;
  nivel: string;
  anio_escolar: string;
  importe_mensual: number;
  descuento_anual_pct: number;
  conceptos_extra: Record<string, number>;
  activa: boolean;
  created_at: string;
}

export interface TarifaCreate {
  nombre: string;
  nivel: string;
  anio_escolar: string;
  importe_mensual: number;
  descuento_anual_pct?: number;
  conceptos_extra?: Record<string, number>;
  activa?: boolean;
}

export interface Cuota {
  id: string;
  tenant_id: string;
  plan_pago_id: string;
  alumno_id: string;
  periodo: string;
  vencimiento: string;
  importe_base: number;
  descuento_pct: number;
  importe_final: number;
  concepto: string;
  status: CuotaStatus;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
}

export type CuotaStatus =
  | 'pendiente'
  | 'en_remesa'
  | 'cobrada'
  | 'devuelta'
  | 'anulada'
  | 'pagada_manual';

export interface CuotaListResponse {
  data: Cuota[];
  total: number;
  pendiente_total: number;
  cobrada_total: number;
}

export interface PlanPagoCreate {
  alumno_id: string;
  tarifa_id: string;
  anio_escolar: string;
  periodicidad: 'mensual' | 'trimestral' | 'anual';
  descuento_extra_pct?: number;
  mandato_sepa_id?: string | null;
}

export interface PlanPago {
  id: string;
  tenant_id: string;
  alumno_id: string;
  tarifa_id: string;
  anio_escolar: string;
  periodicidad: string;
  descuento_extra_pct: number;
  mandato_sepa_id: string | null;
  activo: boolean;
  cuotas: Cuota[];
  created_at: string;
  updated_at: string;
}

export interface MandatoSepaCreate {
  alumno_id: string;
  titular: string;
  iban: string;
  bic?: string;
  firmado_el?: string;
}

export interface MandatoSepa {
  id: string;
  tenant_id: string;
  alumno_id: string;
  referencia: string;
  titular: string;
  iban_last4: string;
  bic: string | null;
  firmado_el: string | null;
  activo: boolean;
  created_at: string;
}

export interface RemesaSepa {
  id: string;
  tenant_id: string;
  referencia: string;
  periodo: string;
  fecha_cobro: string;
  importe_total: number;
  num_cuotas: number;
  status: 'borrador' | 'enviada' | 'procesada' | 'parcialmente_devuelta';
  xml_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface RemesaListResponse {
  data: RemesaSepa[];
  total: number;
}

export interface Recibo {
  id: string;
  tenant_id: string;
  cuota_id: string;
  numero: string;
  importe: number;
  fecha_emision: string;
  pdf_url: string | null;
  sha256: string | null;
  pago_tipo: string;
  stripe_charge_id: string | null;
  created_at: string;
}

export interface ReciboListResponse {
  data: Recibo[];
  total: number;
}

export interface Devolucion {
  id: string;
  tenant_id: string;
  cuota_id: string;
  motivo: string;
  fecha: string;
  importe: number;
  nota: string | null;
  resuelta: boolean;
  created_at: string;
}

export interface FinancialSummary {
  anio_escolar: string;
  cuotas_pendientes: number;
  importe_pendiente: number;
  cuotas_cobradas: number;
  importe_cobrado: number;
  cuotas_devueltas: number;
  importe_devuelto: number;
  remesas_total: number;
}

export interface StripeIntent {
  cuota_id: string;
  client_secret: string;
  amount: number;
  currency: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly api = inject(ApiService);

  // Tarifas
  listTarifas(anioEscolar?: string): Observable<{ data: Tarifa[]; total: number }> {
    return this.api.get('/billing/tarifas', anioEscolar ? { anio_escolar: anioEscolar } : {});
  }

  createTarifa(payload: TarifaCreate): Observable<Tarifa> {
    return this.api.post<Tarifa>('/billing/tarifas', payload);
  }

  // Cuotas
  listCuotas(params: {
    alumno_id?: string;
    status?: CuotaStatus;
    anio_escolar?: string;
  } = {}): Observable<CuotaListResponse> {
    return this.api.get<CuotaListResponse>('/billing/cuotas', params);
  }

  markPaid(cuotaId: string, payload: { tipo: string; fecha: string; referencia_externa?: string; nota?: string }): Observable<{ recibo_id: string; numero: string }> {
    return this.api.post(`/billing/cuotas/${cuotaId}/pagar`, payload);
  }

  createPaymentIntent(cuotaId: string): Observable<StripeIntent> {
    return this.api.post<StripeIntent>(`/billing/cuotas/${cuotaId}/stripe/intent`);
  }

  // Planes de pago
  createPlan(payload: PlanPagoCreate): Observable<PlanPago> {
    return this.api.post<PlanPago>('/billing/planes', payload);
  }

  getPlan(planId: string): Observable<PlanPago> {
    return this.api.get<PlanPago>(`/billing/planes/${planId}`);
  }

  // Mandatos SEPA
  createMandato(payload: MandatoSepaCreate): Observable<MandatoSepa> {
    return this.api.post<MandatoSepa>('/billing/mandatos', payload);
  }

  // Remesas SEPA
  listRemesas(): Observable<RemesaListResponse> {
    return this.api.get<RemesaListResponse>('/billing/remesas');
  }

  confirmRemesa(remesaId: string): Observable<RemesaSepa> {
    return this.api.post<RemesaSepa>(`/billing/remesas/${remesaId}/confirmar`);
  }

  // Devoluciones
  listDevoluciones(resuelta?: boolean): Observable<Devolucion[]> {
    return this.api.get<Devolucion[]>('/billing/devoluciones', resuelta !== undefined ? { resuelta } : {});
  }

  registerDevolucion(payload: { cuota_id: string; motivo: string; fecha: string; nota?: string }): Observable<Devolucion> {
    return this.api.post<Devolucion>('/billing/devoluciones', payload);
  }

  resolveDevolucion(devolucionId: string, nota?: string): Observable<Devolucion> {
    return this.api.patch<Devolucion>(`/billing/devoluciones/${devolucionId}/resolver`, { nota });
  }

  // Recibos
  listRecibos(alumnoId?: string): Observable<ReciboListResponse> {
    return this.api.get<ReciboListResponse>('/billing/recibos', alumnoId ? { alumno_id: alumnoId } : {});
  }

  // Dashboard
  financialSummary(anioEscolar: string): Observable<FinancialSummary> {
    return this.api.get<FinancialSummary>('/billing/summary', { anio_escolar: anioEscolar });
  }
}
