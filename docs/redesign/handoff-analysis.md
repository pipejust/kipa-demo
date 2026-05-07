# K!dS Redesign — Handoff Analysis

> Generated from 10 screenshot mockups + readme.txt + K!dS Design System tokens/components.
> Branch: `redesign/kids-ui`

---

## Global Design System Summary

| Token | Value |
|---|---|
| Primary navy | `#1F3A7A` |
| Navy-600 | `#2A4A94` |
| Green accent | `#1F8E5A` |
| Surface | `#F7F8FC` |
| Paper | `#FFFFFF` |
| Ink | `#17213A` |
| Slate | `#4C5773` |
| Border | `#E3E7F0` |
| Font body | Poppins (readme) / Open Sans (DS file) → **use Poppins** |
| Font display | Poppins / Varela Round → **use Poppins** |
| Font UI | Poppins / Montserrat → **use Poppins** |
| Radius base | 8 / 14 / 20 / 28 / 36 / 999px |
| Shadow sm | `0 1px 2px rgba(31,58,122,.06), 0 2px 6px rgba(31,58,122,.05)` |

### Accent palette
Sky `#4FB3E6` · Mustard `#F3B337` · Pink `#E85A9B` · Purple `#8A4FB8` · Coral `#F0704D`

### Typography hierarchy
- **Display** — Varela Round (or Poppins), weight 400, tight tracking
- **Body** — Open Sans (or Poppins), weight 400/500/600
- **UI chrome** — Montserrat (or Poppins), uppercase for eyebrows

---

## Screenshot 1 — Admin Dashboard `/a/dashboard`

### Layout
- Shell: white sidebar (264px) + content area, white topbar
- Content grid: 3-column KPI row → 2-column activity+interviews → 1-column finance chart → quick-actions row

### Palette dominant
Navy sidebar nav items active, green accent dot, cream background for hero card, mustard KPI accent

### Components visible
- **Sidebar**: K!dS logo mark + wordmark, nav items with Lucide icons (Dashboard, Alumnes, Admissions, Finances, Assistència, Comunicacions, Contingut), family card illustration at bottom, Configuració button
- **Topbar**: pill search input (320px wide), notification bell (coral dot), avatar + name "Maria Admin"
- **KPI cards** (4): Alumnes matriculats 152, Assistència avui 92%, Admissions pendents 7, Recaptació mensual 28.450€ — each with trend sparkline and arrow indicator
- **Activitat recent**: list of recent actions with green "Completat" / orange "Pendent" badges
- **Properes entrevistes**: compact table, date + name + level + tutor
- **Resum financer**: area chart (Evolution line), side panel with top families
- **Accions ràpides**: colored action cards (Afegir alumne / Programar admissió / etc.) in a 4-col row

### States
- Hover on nav: light navy-50 background
- Active nav: cream background + left green rail

### Copy (ca)
"Bon dia, Maria!" · "Curs 2024–2025" · "Dona alta" · "Activitat recent" · "Properes entrevistes" · "Resum financer" · "Accions ràpides"

### Angular route
`/a/dashboard` → `admin-dashboard.component`

---

## Screenshot 2 — Login Page `/login`

### Layout
Split 50/50:
- **Left panel**: navy/sky gradient background, K!dS logo large, tagline "Junts, cada dia és una nova aventura", 3 benefit bullets with icons, illustrated playful characters (rainbow, sun, geometric shapes)
- **Right panel**: white card centered, logo mark, "Benvingut de nou!" heading, tenant selector, email + password fields, remember checkbox, "Has oblidat la contrasenya?" link, primary CTA button "Inicia sessió"

### Palette dominant
Left: deep blue gradient `#1F3A7A → #2A4A94` with yellow/pink confetti blobs
Right: white paper, navy text

### Components visible
- Benefit list: "Comunitat Real-i-propia", "Segur i de confiança", "Pensat per a l'educació infant" (with colored icon blobs)
- Tenant select (dropdown)
- Email input with envelope icon
- Password input with eye toggle
- "Recorda'm" checkbox
- Recovery link
- Primary button (full width, pill shape)
- Footer: "© 2025 K!dS Andorra. Tots els drets reservats."
- Language selector top-right corner

### Copy (ca)
"Plataforma educativa integral" · "Junts, cada dia és una nova aventura" · "Benvingut de nou!" · "Accedeix a la plataforma per continuar" · "Centre" · "Continua amb el teu centre" · "Inicia sessió" · "Necessites ajuda?" · "Continua amb el teu centre"

### Angular route
`/login` → `login.component`

### Key constraint
DO NOT touch: `formControlName="tenant_slug"`, `formControlName="email"`, `formControlName="password"`, `submit()`, `togglePasswordVisibility()`, `fieldHasError()`

---

## Screenshot 3 — Students List `/a/alumnos`

### Layout
- Standard admin shell
- Page header: title "Alumnes" + "Afegir alumne" button (navy, right)
- KPI bar: 5 stat chips (Total 152, P0–P2 12, P3–P5 40, P1–P5 41, P2–P5 39 — by educational level with colored icons)
- Search + filter bar
- Full-width data table
- Pagination footer

### Table columns
Alumno (avatar + name) · Classe · Edat · Tutor/a · Asistència (progress pill) · Pagament (badge) · Accions (Veure link)

### Palette dominant
Navy text, green "Actiu" badge, sky/mustard/pink for level KPIs

### Components visible
- `.table-wrap` with `tbody tr` (required by E2E)
- `.card-row` (mobile cards required by E2E)
- "Veure" action link
- Level filter chips
- Pagination (x de y alumnes)
- Filters panel (right-aligned, "Filtres" label)

### Copy (ca)
"Alumnes" · "Afegir alumne" · "Cerca un alumne o cognom…" · "Total" · "Filtres"

### Angular route
`/a/alumnos` → `students-list.component`

---

## Screenshot 4 — Student Detail `/a/alumnos/:id`

### Layout
- Breadcrumb header: Inici > Fitxa de l'alumne
- Top row: avatar (large 88px) + name + class chip + age + status chips + action buttons (Editar, Contactar família, Veure historial)
- Tabbed content: Resum · Dades personals · Fitxa comentari · Assistència · Adm. i matrícula · Pagaments
- Active tab "Resum":
  - Left column: Dades personals card + Admissió i matrícula card
  - Center: Tutors i contactes (2 tutor cards side-by-side) + Resum de pagaments
  - Right: Assistència últims 30 dies (circular gauge 92%, sparkline chart) + Activitat recent

### Palette dominant
White cards on surface-F7F8FC, navy headings, green success badges

### Components visible
- Large avatar circle (initials fallback)
- Status badge chips (green "Actiu")
- Inline edit button (ghost, small)
- Tab bar (horizontal, underline active)
- Key-value dl pairs
- Attendance ring chart (92%)
- Activity timeline

### Copy (ca)
"Fitxa de l'alumne" · "Editar" · "Contactar família" · "Veure historial" · "Resum" · "Dades personals" · "Tutors i contactes" · "Assistència últims 30 dies" · "Admissió i matrícula" · "Resum de pagaments" · "Activitat recent"

### Angular route
`/a/alumnos/:id` → `student-detail.component`

---

## Screenshot 5 — Admissions List `/a/admissions`

### Layout
- Page header: "Admissions" + "Nova admissió" button
- 5 status KPI cards: Total 18 / Pendents 32 / En revisió 21 / Entrevista 12 / Acceptades 9
- Search bar + filters (Estat · Tutor · Nivell · Curs 2024–2025 · Més filtres)
- Full-width table with pagination

### Table columns
Sol·licitant (avatar + name) · Família · Data presentació · Estat (badge) · Motiu rebuig · Punts prioritat · Accions

### Status badges (required mapping)
`draft` → grey · `submitted` → purple · `under_review` → mustard · `documents_complete` → sky · `interview_scheduled` → pink · `accepted` → green · `rejected` → red · `waitlisted` → mustard · `enrolled` → green

### Copy (ca)
"Admissions" · "Nova admissió" · "Cerca per sol·licitant…" · "Estat" · "Tutor" · "Nivell" · "Curs 2024–2025" · "Més filtres" · "Sol·licitant" · "Família" · "Data presentació" · "Estat" · "Motiu rebuig" · "Punts prioritat" · "Accions"

### Angular route
`/a/admissions` → `admissions-list.component`

---

## Screenshot 6 — Admission Form `/a/admissions/new`

### Layout
- Page header: "Nova admissió" + "Desar i sortir" button (ghost, top-right)
- 8-step stepper (horizontal pill bar at top): Dades de l'alumne · Dades familiars · Informació addicional · Preferències · Documentació · Autoritzacions · Revisió · Confirmació
- Active step: large card form with 2-column grid
- Right sidebar (20% width): "Progrés de l'admissió" panel with vertical step list + percentage
- Footer nav: "Enrere" ghost + "Seguir" primary

### Step 1 visible
Fields: Nom · Cognoms · Data de naixement (date picker) · Gènere (radio: Noi / Noia / No binari) · Nivell sol·licitat (dropdown)
Note callout: "Informació important" alert in cream/yellow

### Copy (ca)
"Nova admissió" · "Introdueix la informació de l'alumne per crear el procés d'admissió" · "Dades de l'alumne" · "Nom" · "Cognoms" · "Data de naixement" · "Gènere" · "Nivell sol·licitat" · "Informació important" · "Enrere" · "Seguir" · "Progrés de l'admissió"

### Angular route
`/a/admissions/new` → `admission-form.component`

### Key constraint
Keep all 8 FormGroups (`alumnoForm`, `tutor1Form`, `tutor2Form`, `medicalForm`, `emergencyForm`, `consentsForm`, plus documents + review). Keep `next()`, `back()`, `submit()`.

---

## Screenshot 7 — Finances `/a/finanzas`

### Layout
- Page header: "Finances" + year selector (2024–2025, dropdown right)
- 4 KPI cards: Total recaptat 134.250€ / Pagaments pendents 18.450€ / Factures vençudes 4.850€ / Remeses actives 12.750€
- Chart area (line/area, full width left 60% + right panel with top families 40%)
- Bottom: "Factures i quotes" table with filters (search + sort + export)

### Palette dominant
Navy for totals, coral/red for overdue, mustard for pending, green for active

### Components visible
- Sparkline trend arrows on KPI cards
- Area chart with multiple series
- Family ranking panel (right of chart)
- Table with badges (Pagat / Pendent / Endarrerit)

### Copy (ca)
"Finances" · "Total recaptat" · "Pagaments pendents" · "Factures vençudes" · "Remeses actives" · "Evolució de la recaptació" · "Factures i quotes" · "Exportar"

### Angular route
`/a/finanzas` → `finance-dashboard.component`

---

## Screenshot 8 — Attendance `/a/asistencia`

### Layout
- Page header: date "Dijous, 24 de maig de 2024" + "Actualitzar" button
- 5 summary cards: Presents 18 (72%) / Absents 4 (16%) / Pendents 2 (8%) / Tardances 0 / Justificats 1
- Right: donut chart (18 de 25 present today)
- Class selector dropdown
- Full table: student avatar + name + class + "Estat d'assistència" toggle buttons

### Action buttons per student
Pres. (green) · Absent (red) · Tard. (mustard) · Just. (sky)

### Copy (ca)
"Assistència" · "Actualitzar" · "Presents" · "Absents" · "Pendents" · "Tardances" · "Justificats" · "Classe" · "Alumne" · "Estat d'assistència"

### Angular route
`/a/asistencia` → `attendance.component`

### Key constraint
Keep backend values: `presente` / `ausente` / `tarde` / `justificado`

---

## Screenshot 9 — Communications `/a/comunicaciones`

### Layout
- Page header: "Comunicacions" + "Nova comunicació" button
- 3-panel layout:
  - Left (30%): "Converses recents" list — avatar + name + snippet + timestamp
  - Center (50%): "Nova comunicació" composer — subject input, rich toolbar (B/I/U/link/list), textarea, channel/programme/schedule meta row, "Enviar" primary button
  - Right (20%): "Canals de difusió" toggles (Correu electrònic, Notificació app, WhatsApp recordatori) + "Estadístiques de la darrera comunicació" (107 Enviats, 98 Entregats, 72 Oberts, 9 Pendents)

### Components visible
- Toggle switches (k-toggle pattern)
- Rich text toolbar (Lucide icons)
- Message list with unread dot indicator
- Stats chips

### Copy (ca)
"Comunicacions" · "Nova comunicació" · "Converses recents" · "Assumpte" · "Canals de difusió" · "Correu electrònic" · "Notificació app" · "WhatsApp / recordatori" · "Estadístiques de la darrera comunicació" · "Enviats" · "Entregats" · "Oberts" · "Pendents"

### Angular route
`/a/comunicaciones` → `comunicaciones.component`

---

## Screenshot 10 — Family Portal Home `/f/inicio`

### Layout
- **Different shell**: navy sidebar (K!dS logo white on dark, family-oriented nav)
- Topbar: "Bon dia, Família López!" with sunshine + rainbow illustration (top-right decorative)
- Content grid (2-column + sidebar):
  - Left: "Els meus fills/es" card (child avatars with status chips) · "Comunicacions recents" list
  - Center: "Continuar sol·licitud d'admissió" progress card · "Pròxims esdeveniments" mini calendar
  - Right: "El dia a l'escola" daily summary card · "Resum de pagaments" financial card · "¿Tens alguna consulta?" CTA card

### Palette dominant
Navy dark sidebar (vs. white admin sidebar), warmer cream background, more illustration-heavy

### Family nav items
Inici · Les meves sol·licituds · Comunicacions · Agenda i activitats · Documents · Preferències

### Sidebar note
Family portal sidebar is DARK NAVY (not white like admin). Same logo but white version.

### Components visible
- Child card with avatar + level + "Matriculat" badge
- Admission progress bar (with steps)
- Payment summary (Total: 2.140€ / A pagar: 0€)
- "Enviar missatge" CTA button
- Recent comms list with unread dots

### Copy (ca)
"Bon dia, Família López!" · "Els meus fills/es" · "Continuar sol·licitud d'admissió" · "El dia a l'escola" · "Comunicacions recents" · "Pròxims esdeveniments" · "Resum de pagaments" · "Tens alguna consulta?"

### Angular route
`/f/inicio` → `family-home.component`

---

## Key Implementation Deltas vs Current Code

| Area | Current | Target |
|---|---|---|
| Font | Open Sans + Varela Round + Montserrat | **Poppins** (all three stacks) |
| Admin sidebar bg | White `#FFFFFF` | White (✓ already correct) |
| Family sidebar bg | White (likely) | **Dark navy** `#1F3A7A` |
| Admin topbar | None (just content) | White topbar 72px with search + bell + user |
| Dashboard | Inline template | Separate `.html` + `.scss` with hero + KPIs |
| Admission form stepper | Horizontal dots | 8-step pill bar + right progress panel |
| Status badges | Raw text | Colored `.k-tag` / `.kds-badge` by status |
| Table | Basic | `.table-wrap` with avatar column + badges |
| Buttons | Pill shape (✓) | Pill shape (✓) |
| `styles.scss` | Imports `_tokens/_components/_utilities` | Add Poppins font link + keep imports |

## Phase Execution Order

1. **Phase 1**: Tokens (font update) · global components SCSS · `index.html` font · admin-shell · family-shell
2. **Phase 2**: Login · Admin Dashboard · Students list/detail
3. **Phase 3**: Admissions list/form · Attendance · Communications
4. **Phase 4**: Finances · Family home · Family admissions · Family payments · Preferences · CMS
5. **Phase 5**: QA · Responsive · A11y · E2E final

## E2E Selectors to Preserve

| Selector | Used in |
|---|---|
| `.table-wrap` | `students-list.spec.ts` |
| `tbody tr` | `students-list.spec.ts` |
| `.card-row` | `students-list.spec.ts` (mobile) |
| `a:has-text("Veure")` | `students-list.spec.ts` |
| Login form fields by label | `admin-login.spec.ts`, `family-login.spec.ts` |
| Dashboard KPI values | `dashboard.spec.ts` |
| Attendance status buttons | `attendance.spec.ts` |
| Admission form steps | `admission-form.spec.ts` |
