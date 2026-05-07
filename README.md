# KIPA · K!dS — Demo (frontend only)

Maqueta interactiva del SaaS multi-tenant K!dS · International Preschool
Andorra, ejecutándose **sin backend**: todas las llamadas `/api/v1/*` las
intercepta `core/api/demo.interceptor.ts` y devuelve datos ficticios.

> 🎯 Este repo existe para mostrar el avance visual del proyecto en
> Vercel. El código real (con FastAPI, Postgres, Celery, Traefik,
> Alembic, RLS, etc.) vive en
> [github.com/pipejust/kipa](https://github.com/pipejust/kipa).

## ¿Qué incluye?

- Login (cualquier email + password ≥ 8 caracteres entra como `Maria Admin`)
- Dashboard administrador con shell K!dS
- Listado de alumnos
- **Fitxa de l'alumne completa** (Marc Costa Martínez es el showcase
  con foto, DNI, 2 tutors, expediente médico, calendario de asistencia,
  admisión con `form_data.matricula` completo, 10 cuotas con 8 pagadas
  + 2 pendientes calculadas relativas a hoy → siempre "Al corrent")
- Family portal con vista del alumno
- Soporte i18n (Català · Castellà · English)

## Probar localmente

```bash
npm ci || npm i
npm start    # http://localhost:4200
```

Como las llamadas API se interceptan, el dev server NO necesita el
backend. Ignora `proxy.conf.json` (no existe en este repo).

## Build de producción

```bash
npm run build -- --configuration production
# bundle a dist/frontend/browser
```

## Deploy

Vercel: el `vercel.json` ya define `buildCommand`, `outputDirectory` y
los rewrites SPA. Conecta el repo en <https://vercel.com/new> y queda
desplegado en cada `git push origin main`.

## Estructura clave

```
src/app/
├── app.config.ts                       # registra demoInterceptor primero
├── core/api/
│   ├── demo.interceptor.ts             # captura /api/v1/* y devuelve fixtures
│   └── demo-fixtures.ts                # datos del showcase
└── (resto: idéntico al monorepo de KIPA)
```

## Limitaciones de la demo

- Sin login real: cualquier credencial es aceptada.
- Sin persistencia: los `PATCH/POST/PUT` simulan éxito pero no guardan nada.
- Sin SSE / WebSocket / notificaciones en tiempo real.
- Endpoints menos importantes (CMS, KPIs, comunicaciones) devuelven listas vacías.

## Volver al backend real

Quita `demoInterceptor` de `provideHttpClient(...)` en `app.config.ts` y
apunta a una API real con `ApiService.baseUrl`. O directamente usa
[el monorepo principal](https://github.com/pipejust/kipa).
