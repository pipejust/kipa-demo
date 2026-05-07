/**
 * StudentCreateModal — quick-add form for the "Afegir alumne" button.
 *
 * Single dialog with two sections (alumne / tutor principal). Tutor is fully
 * optional: leave it blank to skip. On success the parent list refreshes.
 *
 * Backend: POST /api/v1/alumnos with `AlumnoCreate` schema.
 */
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  Output,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { LucideAngularModule, X, UserPlus, Save } from 'lucide-angular';

import { StudentsService } from '../students.service';

type Parentesco = 'padre' | 'madre' | 'tutor_legal' | 'abuelo' | 'abuela' | 'otro';

interface CreatePayload {
  nombre: string;
  apellidos: string;
  fecha_nacimiento?: string;
  genero?: string;
  nivel?: string;
  aula?: string;
  tutores?: Array<{
    nombre: string;
    apellidos: string;
    email?: string;
    telefono?: string;
    parentesco: Parentesco;
    es_responsable_principal: boolean;
  }>;
}

@Component({
  selector: 'kipa-student-create-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, TranslocoModule],
  templateUrl: './student-create-modal.component.html',
  styleUrl: './student-create-modal.component.scss',
})
export class StudentCreateModalComponent {
  /** Fired when the dialog should be dismissed (close, scrim or after success). */
  @Output() closed = new EventEmitter<void>();

  /** Fired on a successful create so the list can refresh + toast. */
  @Output() created = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly studentsService = inject(StudentsService);
  private readonly t = inject(TranslocoService);

  readonly XIcon = X;
  readonly UserPlusIcon = UserPlus;
  readonly SaveIcon = Save;

  readonly saving = signal(false);
  readonly errorMsg = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    // ── Student ─────────────────────────────────────────────────────────────
    nombre:    ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    fecha_nacimiento: [''],
    genero:    [''],
    nivel:     [''],
    aula:      [''],
    // ── Tutor principal (optional) ──────────────────────────────────────────
    tutorNombre:    [''],
    tutorApellidos: [''],
    tutorEmail:     ['', [Validators.email]],
    tutorTelefono:  [''],
    tutorParentesco: ['madre' as Parentesco],
  });

  fieldError(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.dirty || c.touched);
  }

  submit(): void {
    if (this.saving()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // If the user typed any tutor field, all the required tutor fields must
    // be present. Otherwise the whole tutor block is skipped.
    const v = this.form.getRawValue();
    const hasAnyTutorField = !!(v.tutorNombre || v.tutorApellidos || v.tutorEmail || v.tutorTelefono);
    if (hasAnyTutorField && (!v.tutorNombre || !v.tutorApellidos)) {
      this.errorMsg.set(this.t.translate('students.create.errors.tutorIncomplete'));
      return;
    }

    const payload: CreatePayload = {
      nombre: v.nombre.trim(),
      apellidos: v.apellidos.trim(),
    };
    if (v.fecha_nacimiento) payload.fecha_nacimiento = v.fecha_nacimiento;
    if (v.genero) payload.genero = v.genero;
    if (v.nivel)  payload.nivel = v.nivel;
    if (v.aula)   payload.aula = v.aula.trim();

    if (hasAnyTutorField) {
      payload.tutores = [{
        nombre: v.tutorNombre.trim(),
        apellidos: v.tutorApellidos.trim(),
        email: v.tutorEmail.trim() || undefined,
        telefono: v.tutorTelefono.trim() || undefined,
        parentesco: v.tutorParentesco,
        es_responsable_principal: true,
      }];
    }

    this.saving.set(true);
    this.errorMsg.set(null);

    this.studentsService.create(payload as any).subscribe({
      next: () => {
        this.saving.set(false);
        this.created.emit();
        this.closed.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        const detail =
          err.error && typeof err.error === 'object' && 'detail' in err.error
            ? (typeof err.error.detail === 'string'
                ? err.error.detail
                : JSON.stringify(err.error.detail))
            : this.t.translate('students.create.errors.generic');
        this.errorMsg.set(detail);
      },
    });
  }

  cancel(): void {
    if (this.saving()) return;
    this.closed.emit();
  }
}
