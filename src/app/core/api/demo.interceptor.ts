/**
 * Demo HTTP interceptor — services Angular's HttpClient with canned data
 * so the SPA runs end-to-end on Vercel without any backend.
 *
 * Strategy:
 *   - Intercept everything addressed at /api/v1/*
 *   - Pattern-match the URL + method to a fixture
 *   - Return a 200 with a synthetic body
 *   - For unknown endpoints, return a permissive empty payload so the
 *     UI never crashes (lists become empty, totals 0, etc.)
 */
import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import {
  DEMO_TENANT,
  DEMO_USER,
  DEMO_ALUMNOS,
  DEMO_ALUMNO_DETAILS,
  DEMO_ADMISSIONS,
  cuotasFor,
  attendanceFor,
} from './demo-fixtures';

const API_PREFIX = '/api/v1';

function ok<T>(body: T, latencyMs = 80): Observable<HttpEvent<T>> {
  return of(new HttpResponse({ status: 200, body })).pipe(delay(latencyMs));
}

function notFound() {
  return of(new HttpResponse({ status: 404, body: { detail: 'Not found' } }));
}

/** Extract `?alumno_id=...` (or any other query param) from an Angular req. */
const param = (req: HttpRequest<unknown>, name: string): string | null =>
  req.params?.get(name) ?? null;

/** Return the alumno UUID from a /alumnos/{id} URL, or null. */
function alumnoIdFrom(url: string): string | null {
  const m = url.match(/\/alumnos\/([0-9a-f-]+)/i);
  return m ? m[1] : null;
}

export const demoInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const url = req.url.split('?')[0];

  // Only intercept API calls; let asset / i18n / static fetches through.
  if (!url.startsWith(API_PREFIX)) {
    return next(req);
  }

  const path = url.slice(API_PREFIX.length);
  const method = req.method.toUpperCase();

  // ─── Auth ──────────────────────────────────────────────────────────
  if (path === '/auth/login' && method === 'POST') {
    return ok({
      access_token: 'demo-token',
      refresh_token: 'demo-refresh',
      token_type: 'bearer',
      expires_in: 1800,
      user: DEMO_USER,
    });
  }
  if (path === '/auth/refresh' && method === 'POST') {
    return ok({
      access_token: 'demo-token',
      refresh_token: 'demo-refresh',
      token_type: 'bearer',
      expires_in: 1800,
      user: DEMO_USER,
    });
  }
  if (path === '/auth/me' && method === 'GET') {
    return ok({
      user: DEMO_USER,
      tenant: DEMO_TENANT,
      role: 'admin',
    });
  }
  if (path === '/auth/logout' && method === 'POST') {
    return of(new HttpResponse({ status: 204 }));
  }
  if (path === '/auth/forgot-password' || path === '/auth/reset-password') {
    return of(new HttpResponse({ status: 202 }));
  }

  // ─── Tenants ───────────────────────────────────────────────────────
  if (path === '/tenants/public' && method === 'GET') {
    return ok([DEMO_TENANT]);
  }

  // ─── Account / preferences ─────────────────────────────────────────
  if (path === '/account/me' && method === 'GET') {
    return ok(DEMO_USER);
  }
  if (path.startsWith('/account/me') && (method === 'PATCH' || method === 'PUT')) {
    return ok(DEMO_USER);
  }

  // ─── Alumnos ───────────────────────────────────────────────────────
  if (path === '/alumnos' && method === 'GET') {
    return ok({
      data: DEMO_ALUMNOS,
      items: DEMO_ALUMNOS,
      total: DEMO_ALUMNOS.length,
      page: 1,
      limit: 20,
    });
  }
  if (path.startsWith('/alumnos/') && method === 'GET') {
    const id = alumnoIdFrom(path);
    if (id && DEMO_ALUMNO_DETAILS[id]) return ok(DEMO_ALUMNO_DETAILS[id]);
    return notFound();
  }
  if (path.startsWith('/alumnos/') && method === 'PATCH') {
    const id = alumnoIdFrom(path);
    if (id && DEMO_ALUMNO_DETAILS[id]) {
      const merged = { ...DEMO_ALUMNO_DETAILS[id], ...(req.body as object) };
      return ok(merged);
    }
    return notFound();
  }

  // ─── Admissions ────────────────────────────────────────────────────
  if (path === '/admissions' && method === 'GET') {
    const aid = param(req, 'alumno_id');
    const items = aid ? DEMO_ADMISSIONS.filter((a) => a.alumno_id === aid) : DEMO_ADMISSIONS;
    return ok({ data: items, items, total: items.length, page: 1, limit: 20 });
  }
  if (path.startsWith('/admissions/') && method === 'GET') {
    const m = path.match(/\/admissions\/([^/]+)/);
    const id = m ? m[1] : null;
    const adm = DEMO_ADMISSIONS.find((a) => a.id === id);
    return adm ? ok(adm) : notFound();
  }

  // ─── Billing (cuotas, summary, etc.) ───────────────────────────────
  if (path === '/billing/cuotas' && method === 'GET') {
    const aid = param(req, 'alumno_id');
    const data = cuotasFor(aid);
    const cobrada = data.filter((c) => c.status === 'cobrada' || c.status === 'pagada_manual')
                        .reduce((s, c) => s + c.importe_final, 0);
    const pendiente = data.filter((c) => c.status === 'pendiente')
                          .reduce((s, c) => s + c.importe_final, 0);
    return ok({
      data,
      total: data.length,
      pendiente_total: pendiente,
      cobrada_total: cobrada,
    });
  }
  if (path === '/billing/recibos' && method === 'GET') {
    return ok({ data: [], total: 0 });
  }
  if (path === '/billing/summary' && method === 'GET') {
    const all = cuotasFor(null);
    const cobradas = all.filter((c) => c.status === 'cobrada');
    const pendientes = all.filter((c) => c.status === 'pendiente');
    return ok({
      anio_escolar: 'demo',
      cuotas_pendientes: pendientes.length,
      importe_pendiente: pendientes.reduce((s, c) => s + c.importe_final, 0),
      cuotas_cobradas: cobradas.length,
      importe_cobrado: cobradas.reduce((s, c) => s + c.importe_final, 0),
      cuotas_devueltas: 0,
      importe_devuelto: 0,
      remesas_total: 0,
    });
  }
  if (path === '/billing/tarifas' && method === 'GET') {
    return ok({ data: [], total: 0 });
  }
  if (path === '/billing/remesas' && method === 'GET') {
    return ok({ data: [], total: 0 });
  }
  if (path === '/billing/devoluciones' && method === 'GET') {
    return ok([]);
  }

  // ─── Attendance ────────────────────────────────────────────────────
  if (path.startsWith('/attendance/alumno/') && method === 'GET') {
    const m = path.match(/\/attendance\/alumno\/([0-9a-f-]+)/i);
    const aid = m ? m[1] : null;
    return aid ? ok(attendanceFor(aid)) : ok({ data: [], total: 0 });
  }
  if (path === '/attendance' && method === 'GET') {
    return ok({ data: [], total: 0 });
  }
  if (path === '/attendance' && method === 'PUT') {
    return ok(req.body);
  }

  // ─── KPIs / CMS / Communications / Notifications / Pedagogía ───────
  // Empty-but-shape-correct responses so the UI doesn't crash.
  if (path.startsWith('/kpis')) return ok({ data: {}, summary: {} });
  if (path.startsWith('/cms')) {
    if (method === 'GET' && /\/cms\/[^/]+$/.test(path)) {
      return ok({ id: 'demo', title: 'Demo content', content: '', published: true });
    }
    return ok({ data: [], total: 0 });
  }
  if (path.startsWith('/communications')) return ok({ data: [], total: 0 });
  if (path.startsWith('/notifications')) {
    if (method === 'GET') return ok({ data: [], total: 0, unread: 0 });
    return ok({ ok: true });
  }
  if (path.startsWith('/pedagogia')) return ok({ data: [], total: 0 });

  // ─── Default: empty 200 — keeps the SPA happy on unknown endpoints
  return ok({ data: [], total: 0 });
};
