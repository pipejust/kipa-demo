export type AdmissionStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'admitted'
  | 'rejected'
  | 'withdrawn'
  | string;

export interface AdmissionFormData {
  alumno?: {
    nombre?: string;
    apellidos?: string;
    fecha_nacimiento?: string;
    genero?: 'M' | 'F' | 'X' | '';
    nivel?: string;
  };
  tutor1?: {
    nombre?: string;
    apellidos?: string;
    email?: string;
    telefono?: string;
    dni?: string;
    parentesco?: string;
  };
  tutor2?: {
    nombre?: string;
    apellidos?: string;
    email?: string;
    telefono?: string;
    dni?: string;
    parentesco?: string;
  };
  medical?: {
    alergias?: string;
    medicacion?: string;
    grupo_sanguineo?: string;
    medico?: string;
  };
  emergency?: {
    contacto?: string;
    telefono?: string;
    relacion?: string;
  };
  matricula?: {
    horario?: string;
    dias?: string;
    classe?: string;
    observaciones?: string;
  };
  consents?: {
    fotos?: boolean;
    datos?: boolean;
    reglamento?: boolean;
  };
  documents?: Record<string, { uploaded: boolean; filename?: string }>;
}

export interface Admission {
  id: string;
  alumno_id: string;
  alumno_nombre?: string;
  anio_escolar: string;
  nivel_solicitado: string;
  status: AdmissionStatus;
  current_step: number;
  form_data: AdmissionFormData;
  pdf_url?: string | null;
  submitted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}
