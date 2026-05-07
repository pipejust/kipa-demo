/**
 * Static demo data for the K!dS · Andorra showcase.
 *
 * Used by demo-interceptor.ts to satisfy every /api/v1/* request the
 * Angular app makes when KIPA_DEMO_MODE is on. Numbers are computed
 * relative to "today" so the student always reads as "Al corrent".
 */

const tenantId = '00000000-0000-0000-0000-000000000001';
export const DEMO_TENANT = {
  id: tenantId,
  slug: 'kids-andorra',
  name: 'K!dS · International Preschool Andorra',
  status: 'active',
};

export const DEMO_USER = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'maria.admin@kids.demo',
  full_name: 'Maria Admin',
  status: 'active',
  role: 'admin',
  tenant_id: tenantId,
  preferences: {
    general: { language: 'ca', timezone: 'Europe/Andorra', date_format: 'DD/MM/YYYY', week_start: 'monday' },
    appearance: { theme: 'light' },
    notifications: { email: true, push: true },
  },
};

const today = new Date();
const yyyy = today.getFullYear();

/** Current academic year window: Sept of (year-1 if before Aug) → June of next. */
const yearStart = today.getMonth() >= 7 ? yyyy : yyyy - 1;
export const SCHOOL_YEAR = `${yearStart}-${yearStart + 1}`;

const iso = (d: Date) => d.toISOString();
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const minus = (days: number) => { const d = new Date(today); d.setDate(d.getDate() - days); return d; };

// ── Students ─────────────────────────────────────────────────────────
const marcId = 'aaaa1111-aaaa-1111-aaaa-111111111111';
const emmaId = 'bbbb2222-bbbb-2222-bbbb-222222222222';
const juliaId = 'cccc3333-cccc-3333-cccc-333333333333';
const pauId = 'dddd4444-dddd-4444-dddd-444444444444';
const noaId = 'eeee5555-eeee-5555-eeee-555555555555';

const baseStudent = {
  tenant_id: tenantId,
  consentimiento_foto: 'si',
  consentimiento_datos: true,
  created_at: '2024-09-02T08:00:00Z',
  updated_at: iso(today),
};

export const DEMO_ALUMNOS = [
  {
    ...baseStudent,
    id: marcId,
    nombre: 'Marc',
    apellidos: 'Costa Martínez',
    nombre_completo: 'Marc Costa Martínez',
    fecha_nacimiento: '2022-03-20',
    genero: 'M',
    nacionalidad: 'Andorrana',
    dni: 'AND-12345678',
    idioma_principal: 'Català',
    nivel: 'P3',
    aula: 'Butterflies',
    status: 'enrolled',
    foto_url: 'https://i.pravatar.cc/240?img=12',
    email: null,
    telefono: null,
  },
  {
    ...baseStudent,
    id: emmaId,
    nombre: 'Emma',
    apellidos: 'Rodríguez López',
    nombre_completo: 'Emma Rodríguez López',
    fecha_nacimiento: '2022-03-20',
    genero: 'F',
    nacionalidad: 'Espanyola',
    dni: '47851234A',
    idioma_principal: 'Espanyol',
    nivel: 'P2',
    aula: 'Butterflies',
    status: 'enrolled',
    foto_url: 'https://i.pravatar.cc/240?img=32',
    email: null,
    telefono: null,
  },
  {
    ...baseStudent,
    id: juliaId,
    nombre: 'Júlia',
    apellidos: 'Serra Vidal',
    nombre_completo: 'Júlia Serra Vidal',
    fecha_nacimiento: '2022-06-15',
    genero: 'F',
    nacionalidad: 'Andorrana',
    dni: 'AND-87654321',
    idioma_principal: 'Català',
    nivel: 'P2',
    aula: 'Ladybugs',
    status: 'enrolled',
    foto_url: 'https://i.pravatar.cc/240?img=47',
    email: null,
    telefono: null,
  },
  {
    ...baseStudent,
    id: pauId,
    nombre: 'Pau',
    apellidos: 'García Roca',
    nombre_completo: 'Pau García Roca',
    fecha_nacimiento: '2021-11-08',
    genero: 'M',
    nacionalidad: 'Andorrana',
    dni: null,
    idioma_principal: 'Català',
    nivel: 'P3',
    aula: 'Butterflies',
    status: 'admitted',
    foto_url: null,
    email: null,
    telefono: null,
  },
  {
    ...baseStudent,
    id: noaId,
    nombre: 'Noa',
    apellidos: 'Puig Font',
    nombre_completo: 'Noa Puig Font',
    fecha_nacimiento: '2023-01-22',
    genero: 'F',
    nacionalidad: 'Andorrana',
    dni: null,
    idioma_principal: 'Català',
    nivel: 'P1',
    aula: 'Ladybugs',
    status: 'prospect',
    foto_url: null,
    email: null,
    telefono: null,
  },
];

// ── Tutors per student (Marc + Emma get the rich pair, others single) ─
function tutors(studentId: string) {
  if (studentId === marcId) {
    return [
      {
        id: 't-marc-madre',
        nombre: 'Laia',
        apellidos: 'Costa Martínez',
        email: 'laia.costa@example.com',
        telefono: '+376 345 678',
        parentesco: 'madre',
        es_responsable_principal: true,
        autorizado_recoger: true,
      },
      {
        id: 't-marc-padre',
        nombre: 'Javier',
        apellidos: 'Martínez',
        email: 'javier.martinez@example.com',
        telefono: '+376 321 987',
        parentesco: 'padre',
        es_responsable_principal: false,
        autorizado_recoger: true,
      },
    ];
  }
  if (studentId === emmaId) {
    return [
      {
        id: 't-emma-madre',
        nombre: 'María',
        apellidos: 'López García',
        email: 'maria.lopez@example.com',
        telefono: '+376 345 678',
        parentesco: 'madre',
        es_responsable_principal: true,
        autorizado_recoger: true,
      },
      {
        id: 't-emma-padre',
        nombre: 'Javier',
        apellidos: 'Rodríguez Sánchez',
        email: 'javier.rodriguez@example.com',
        telefono: '+376 321 987',
        parentesco: 'padre',
        es_responsable_principal: false,
        autorizado_recoger: true,
      },
    ];
  }
  return [
    {
      id: `t-${studentId}-1`,
      nombre: 'Anna',
      apellidos: 'Roca',
      email: 'familia@example.com',
      telefono: '+376 700 000',
      parentesco: 'madre',
      es_responsable_principal: true,
      autorizado_recoger: true,
    },
  ];
}

const medical = (studentId: string) => ({
  alergias: studentId === pauId ? ['Fruits secs'] : [],
  medicacion: [],
  condiciones: [],
  grupo_sanguineo: studentId === marcId ? '0+' : 'A+',
  medico_nombre: 'Dra. Anna Pujol',
  medico_tel: '+376 800 100',
  notas: null,
});

export const DEMO_ALUMNO_DETAILS = Object.fromEntries(
  DEMO_ALUMNOS.map((a) => [
    a.id,
    { ...a, tutores: tutors(a.id), datos_medicos: medical(a.id) },
  ]),
);

// ── Admissions (one per showcase student) ────────────────────────────
export const DEMO_ADMISSIONS = DEMO_ALUMNOS.map((a) => ({
  id: `adm-${a.id}`,
  tenant_id: tenantId,
  alumno_id: a.id,
  alumno_nombre: a.nombre_completo,
  anio_escolar: SCHOOL_YEAR,
  nivel_solicitado: a.nivel,
  status: a.status === 'enrolled' ? 'enrolled'
        : a.status === 'admitted' ? 'approved'
        : 'submitted',
  current_step: a.status === 'enrolled' ? 8 : 5,
  submitted_at: '2024-09-02T09:00:00Z',
  pdf_url: null,
  created_at: '2024-09-02T08:00:00Z',
  updated_at: iso(today),
  form_data: {
    alumno: {
      nombre: a.nombre,
      apellidos: a.apellidos,
      fecha_nacimiento: a.fecha_nacimiento,
      genero: a.genero,
      nivel: a.nivel,
    },
    matricula: {
      horario: '9:00 - 16:30',
      dias: 'Dilluns a Divendres',
      classe: a.aula,
      observaciones: 'Cap',
    },
    consents: { fotos: true, datos: true, reglamento: true },
  },
}));

// ── Cuotas (10 per showcase student, paid up to today) ───────────────
function buildCuotas(alumnoId: string) {
  const out: any[] = [];
  for (let i = 0; i < 10; i++) {
    const month = 9 + i;
    const year = yearStart + (month > 12 ? 1 : 0);
    const m = ((month - 1) % 12) + 1;
    const periodo = `${year}-${String(m).padStart(2, '0')}`;
    const venc = new Date(year, m - 1, 5);
    const isPaid = venc <= today;
    out.push({
      id: `cuota-${alumnoId}-${i}`,
      tenant_id: tenantId,
      plan_pago_id: `plan-${alumnoId}`,
      alumno_id: alumnoId,
      periodo,
      vencimiento: ymd(venc),
      importe_base: 350.0,
      descuento_pct: 0.0,
      importe_final: 350.0,
      concepto: `Quota mensual ${periodo} · Butterflies`,
      status: isPaid ? 'cobrada' : 'pendiente',
      stripe_payment_intent_id: null,
      created_at: '2024-09-02T08:00:00Z',
      updated_at: iso(today),
    });
  }
  return out;
}

const DEMO_CUOTAS_BY_ALUMNO: Record<string, any[]> = Object.fromEntries(
  DEMO_ALUMNOS.map((a) => [a.id, buildCuotas(a.id)]),
);

export function cuotasFor(alumnoId: string | null) {
  if (alumnoId && DEMO_CUOTAS_BY_ALUMNO[alumnoId]) {
    return DEMO_CUOTAS_BY_ALUMNO[alumnoId];
  }
  // No filter → flatten all
  return Object.values(DEMO_CUOTAS_BY_ALUMNO).flat();
}

// ── Attendance: last 30 days, mostly present ────────────────────────
export function attendanceFor(alumnoId: string) {
  const items: any[] = [];
  for (let i = 0; i < 30; i++) {
    const d = minus(i);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends
    // Sprinkle the occasional absence/late so the chart looks real.
    const r = Math.abs((alumnoId.charCodeAt(0) + i * 7) % 13);
    const estado: 'presente' | 'tarde' | 'ausente' | 'justificado' =
      r === 0 ? 'ausente' : r === 1 ? 'tarde' : r === 2 ? 'justificado' : 'presente';
    items.push({
      id: `att-${alumnoId}-${i}`,
      tenant_id: tenantId,
      alumno_id: alumnoId,
      fecha: ymd(d),
      estado,
      nota: null,
      justificado_por: estado === 'justificado' ? 'Visita mèdica' : null,
      created_at: iso(d),
      updated_at: iso(d),
    });
  }
  return { data: items, total: items.length };
}
