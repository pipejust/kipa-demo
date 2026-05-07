import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  ArrowLeft,
  ArrowRight,
  Check,
  Minus,
  Save,
  Upload,
  FileCheck,
  CheckCircle2,
} from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';

import { Admission, AdmissionFormData } from '../../../shared/models/admission.model';
import { AdmissionsService } from '../admissions.service';

interface StepDefinition {
  index: number;
  key: string;
  title: string;
  hint: string;
}

/** Keys must match backend DocumentType enum values exactly. */
const REQUIRED_DOCUMENTS: ReadonlyArray<{ key: string; label: string; description: string }> = [
  { key: 'libro_familia', label: 'Llibre de família', description: 'Certifica el vincle amb els tutors.' },
  { key: 'dni_tutor', label: 'DNI/NIE del tutor', description: 'Per acreditar la identitat.' },
  { key: 'cartilla_vacunacion', label: 'Cartilla de vacunes', description: 'Document mèdic actualitzat.' },
  { key: 'foto_alumno', label: 'Fotografia recent', description: 'Carnet o similar.' },
];

@Component({
  selector: 'kipa-admission-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule, TranslocoModule],
  templateUrl: './admission-form.component.html',
  styleUrl: './admission-form.component.scss',
})
export class AdmissionFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly admissions = inject(AdmissionsService);

  readonly ArrowLeft = ArrowLeft;
  readonly ArrowRight = ArrowRight;
  readonly Check = Check;
  readonly Minus = Minus;
  readonly Save = Save;
  readonly Upload = Upload;
  readonly FileCheck = FileCheck;
  readonly Done = CheckCircle2;

  readonly REQUIRED_DOCUMENTS = REQUIRED_DOCUMENTS;

  readonly steps: ReadonlyArray<StepDefinition> = [
    { index: 0, key: 'alumno', title: 'Alumne', hint: 'Dades bàsiques de l\'infant' },
    { index: 1, key: 'tutor1', title: 'Tutor principal', hint: 'Persona de referència' },
    { index: 2, key: 'tutor2', title: 'Segon tutor', hint: 'Opcional' },
    { index: 3, key: 'medical', title: 'Salut', hint: 'Informació mèdica bàsica' },
    { index: 4, key: 'emergency', title: 'Emergència', hint: 'Contacte alternatiu' },
    { index: 5, key: 'consents', title: 'Consentiments', hint: 'Imatge, dades i normativa' },
    { index: 6, key: 'documents', title: 'Documents', hint: 'Pujada de fitxers' },
    { index: 7, key: 'review', title: 'Revisió', hint: 'Comprova i envia' },
  ];

  readonly currentStep = signal(0);
  readonly admissionId = signal<string | null>(null);
  readonly creating = signal(false);
  readonly saving = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly lastSavedAt = signal<Date | null>(null);
  readonly success = signal(false);

  readonly alumnoForm = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    apellidos: ['', Validators.required],
    fecha_nacimiento: ['', Validators.required],
    genero: ['' as '' | 'M' | 'F' | 'X', Validators.required],
    nivel: ['', Validators.required],
  });

  readonly tutor1Form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    apellidos: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', Validators.required],
    dni: [''],
    parentesco: ['', Validators.required],
  });

  readonly tutor2Form = this.fb.nonNullable.group({
    nombre: [''],
    apellidos: [''],
    email: ['', Validators.email],
    telefono: [''],
    dni: [''],
    parentesco: [''],
  });

  readonly medicalForm = this.fb.nonNullable.group({
    alergias: [''],
    medicacion: [''],
    grupo_sanguineo: [''],
    medico: [''],
  });

  readonly emergencyForm = this.fb.nonNullable.group({
    contacto: ['', Validators.required],
    telefono: ['', Validators.required],
    relacion: [''],
  });

  readonly consentsForm = this.fb.nonNullable.group({
    fotos: [false],
    datos: [false, Validators.requiredTrue],
    reglamento: [false, Validators.requiredTrue],
  });

  readonly documents = signal<Record<string, { uploaded: boolean; filename?: string }>>({});

  readonly progressPct = computed(() => Math.round(((this.currentStep() + 1) / this.steps.length) * 100));
  readonly isLastStep = computed(() => this.currentStep() === this.steps.length - 1);
  readonly stepTitle = computed(() => this.steps[this.currentStep()].title);
  readonly stepHint = computed(() => this.steps[this.currentStep()].hint);

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  pendingDocKey: string | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.admissionId.set(id);
      this.loadExisting(id);
      return;
    }
    // For new admissions we defer creation until the user fills the alumno step.
  }

  private loadExisting(id: string): void {
    this.admissions.getById(id).subscribe({
      next: (admission) => {
        this.applyAdmission(admission);
      },
      error: () => this.error.set('No s\'ha pogut carregar la sol·licitud.'),
    });
  }

  private applyAdmission(a: Admission): void {
    this.admissionId.set(a.id);
    this.currentStep.set(Math.min(Math.max(a.current_step ?? 0, 0), this.steps.length - 1));
    const fd = a.form_data ?? {};
    if (fd.alumno) this.alumnoForm.patchValue(fd.alumno as never);
    if (fd.tutor1) this.tutor1Form.patchValue(fd.tutor1 as never);
    if (fd.tutor2) this.tutor2Form.patchValue(fd.tutor2 as never);
    if (fd.medical) this.medicalForm.patchValue(fd.medical as never);
    if (fd.emergency) this.emergencyForm.patchValue(fd.emergency as never);
    if (fd.consents) this.consentsForm.patchValue(fd.consents as never);
    if (fd.documents) this.documents.set({ ...fd.documents });
  }

  private collectFormData(): AdmissionFormData {
    return {
      alumno: this.alumnoForm.getRawValue(),
      tutor1: this.tutor1Form.getRawValue(),
      tutor2: this.tutor2Form.getRawValue(),
      medical: this.medicalForm.getRawValue(),
      emergency: this.emergencyForm.getRawValue(),
      consents: this.consentsForm.getRawValue(),
      documents: this.documents(),
    };
  }

  validateStep(index: number): boolean {
    switch (index) {
      case 0:
        this.alumnoForm.markAllAsTouched();
        return this.alumnoForm.valid;
      case 1:
        this.tutor1Form.markAllAsTouched();
        return this.tutor1Form.valid;
      case 2:
        this.tutor2Form.markAllAsTouched();
        return this.tutor2Form.valid;
      case 3:
        return true;
      case 4:
        this.emergencyForm.markAllAsTouched();
        return this.emergencyForm.valid;
      case 5:
        this.consentsForm.markAllAsTouched();
        return this.consentsForm.valid;
      case 6:
        return true;
      case 7:
        return this.allFormsValid();
      default:
        return true;
    }
  }

  allFormsValid(): boolean {
    return (
      this.alumnoForm.valid &&
      this.tutor1Form.valid &&
      this.tutor2Form.valid &&
      this.emergencyForm.valid &&
      this.consentsForm.valid
    );
  }

  goToStep(index: number): void {
    if (index < 0 || index > this.steps.length - 1) return;
    if (index <= this.currentStep()) {
      this.currentStep.set(index);
      return;
    }
    if (!this.validateStep(this.currentStep())) {
      return;
    }
    this.persistDraft();
    this.currentStep.set(index);
  }

  next(): void {
    if (!this.validateStep(this.currentStep())) return;
    this.persistDraft();
    if (!this.isLastStep()) {
      this.currentStep.update((v) => v + 1);
    }
  }

  back(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update((v) => v - 1);
    }
  }

  /**
   * Creates the admission on the server (first persistence) and then patches.
   * Called when the user advances from the first step or autosaves.
   */
  private persistDraft(): void {
    const id = this.admissionId();
    const formData = this.collectFormData();

    if (!id) {
      // Need to create. We require alumno data to be valid first.
      if (!this.alumnoForm.valid) return;
      if (this.creating()) return;
      this.creating.set(true);
      const alumno = this.alumnoForm.getRawValue();
      const anioEscolar = this.computeSchoolYear();

      this.admissions
        .create({
          alumno_id: '', // backend resolves or auto-creates by tenant; placeholder keeps the contract.
          anio_escolar: anioEscolar,
          nivel_solicitado: alumno.nivel,
        })
        .subscribe({
          next: (admission) => {
            this.creating.set(false);
            this.admissionId.set(admission.id);
            this.patchDraft(admission.id, formData);
          },
          error: (err: unknown) => {
            this.creating.set(false);
            // Fallback: surface a soft warning but allow user to continue locally.
            this.error.set(this.parseError(err, 'No s\'ha pogut iniciar la sol·licitud al servidor. Continua i ho intentarem de nou.'));
          },
        });
      return;
    }

    this.patchDraft(id, formData);
  }

  private patchDraft(id: string, formData: AdmissionFormData): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.admissions
      .update(id, { current_step: this.currentStep(), form_data: formData })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.lastSavedAt.set(new Date());
        },
        error: () => {
          this.saving.set(false);
          // Keep silent; autosave failures shouldn't block the user.
        },
      });
  }

  private computeSchoolYear(): string {
    const now = new Date();
    const y = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    return `${y}-${y + 1}`;
  }

  promptUpload(key: string): void {
    this.pendingDocKey = key;
    this.fileInput?.nativeElement.click();
  }

  onFileChosen(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const key = this.pendingDocKey;
    if (!file || !key) {
      this.pendingDocKey = null;
      return;
    }
    const id = this.admissionId();
    // Always optimistic-update local state
    this.documents.update((docs) => ({ ...docs, [key]: { uploaded: true, filename: file.name } }));
    this.pendingDocKey = null;
    input.value = '';

    if (id) {
      this.admissions.uploadDocument(id, file, key).subscribe({
        error: () => {
          // Rollback on failure
          this.documents.update((docs) => {
            const next = { ...docs };
            delete next[key];
            return next;
          });
          this.error.set('No s\'ha pogut pujar el document. Torna-ho a provar.');
        },
      });
    }
  }

  submit(): void {
    if (!this.allFormsValid()) {
      this.error.set('Hi ha camps obligatoris pendents. Revisa els passos marcats.');
      return;
    }
    let id = this.admissionId();
    this.submitting.set(true);

    const finalize = (admissionId: string): void => {
      const formData = this.collectFormData();
      this.admissions
        .update(admissionId, { current_step: this.steps.length - 1, form_data: formData })
        .subscribe({
          next: () => {
            this.admissions.transition(admissionId, { new_status: 'submitted' }).subscribe({
              next: () => {
                this.submitting.set(false);
                this.success.set(true);
              },
              error: (err: unknown) => {
                this.submitting.set(false);
                this.error.set(this.parseError(err, 'No s\'ha pogut enviar la sol·licitud.'));
              },
            });
          },
          error: (err: unknown) => {
            this.submitting.set(false);
            this.error.set(this.parseError(err, 'No s\'ha pogut guardar abans d\'enviar.'));
          },
        });
    };

    if (!id) {
      const alumno = this.alumnoForm.getRawValue();
      this.admissions
        .create({
          alumno_id: '',
          anio_escolar: this.computeSchoolYear(),
          nivel_solicitado: alumno.nivel,
        })
        .subscribe({
          next: (a) => {
            id = a.id;
            this.admissionId.set(a.id);
            finalize(a.id);
          },
          error: (err: unknown) => {
            this.submitting.set(false);
            this.error.set(this.parseError(err, 'No s\'ha pogut crear la sol·licitud.'));
          },
        });
    } else {
      finalize(id);
    }
  }

  goToList(): void {
    this.router.navigate(['/a/admissions']);
  }

  private parseError(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) return 'No hi ha connexió amb el servidor.';
    }
    return fallback;
  }

  isStepCompleted(index: number): boolean {
    if (this.success()) return true;
    if (index < this.currentStep()) return true;
    return false;
  }

  hasStepError(index: number): boolean {
    switch (index) {
      case 0: return this.alumnoForm.invalid && this.alumnoForm.touched;
      case 1: return this.tutor1Form.invalid && this.tutor1Form.touched;
      case 4: return this.emergencyForm.invalid && this.emergencyForm.touched;
      case 5: return this.consentsForm.invalid && this.consentsForm.touched;
      default: return false;
    }
  }
}
