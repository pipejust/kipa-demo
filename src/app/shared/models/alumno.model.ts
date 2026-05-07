export type AlumnoStatus =
  | 'inquiry'
  | 'prospect'
  | 'admitted'
  | 'enrolled'
  | 'waitlisted'
  | 'withdrawn'
  | 'graduated'
  | 'alumni'
  | string;

export type ConsentimientoFoto = 'si' | 'no' | 'pendiente';

export interface Alumno {
  id: string;
  nombre: string;
  apellidos: string;
  nombre_completo?: string;
  fecha_nacimiento?: string | null;
  genero?: 'M' | 'F' | 'X' | null;
  nivel?: string | null;
  aula?: string | null;
  status: AlumnoStatus;
  email?: string | null;
  telefono?: string | null;
  nacionalidad?: string | null;
  idioma_principal?: string | null;
  dni?: string | null;
  foto_url?: string | null;
  consentimiento_foto?: ConsentimientoFoto | string | null;
  consentimiento_datos?: boolean | null;
  observaciones?: string | null;
  created_at?: string;
  updated_at?: string;
  tutores?: Tutor[];
  /** Frontend convenience union: backend returns the new shape, legacy data may still ship the old. */
  medical?: MedicalInfo | null;
  datos_medicos?: DatosMedicosPayload | null;
}

export type ParentescoType =
  | 'padre'
  | 'madre'
  | 'tutor_legal'
  | 'abuelo'
  | 'abuela'
  | 'tutor'
  | 'otro'
  | string;

export interface Tutor {
  id?: string;
  nombre: string;
  apellidos: string;
  email?: string | null;
  telefono?: string | null;
  telefono_alt?: string | null;
  dni?: string | null;
  parentesco?: ParentescoType;
  /** Backend canonical field. */
  es_responsable_principal?: boolean;
  /** Legacy alias kept for older clients. Prefer `es_responsable_principal`. */
  primario?: boolean;
  autorizado_recoger?: boolean;
}

/** Legacy/string-based shape kept for the family portal and old fixtures. */
export interface MedicalInfo {
  alergias?: string | null;
  medicacion?: string | null;
  grupo_sanguineo?: string | null;
  medico?: string | null;
  notas?: string | null;
}

/** Backend canonical shape: lists, separate medico_nombre/tel. */
export interface DatosMedicosPayload {
  alergias?: string[] | null;
  medicacion?: string[] | null;
  condiciones?: string[] | null;
  grupo_sanguineo?: string | null;
  medico_nombre?: string | null;
  medico_tel?: string | null;
  notas?: string | null;
}

export interface AlumnoListResponse {
  data?: Alumno[];
  items?: Alumno[];
  results?: Alumno[];
  meta?: { total: number; page: number; limit: number };
  total?: number;
  page?: number;
  limit?: number;
}
