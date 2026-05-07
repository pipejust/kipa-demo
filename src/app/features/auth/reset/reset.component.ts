import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-angular';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { AuthService } from '../../../core/auth/auth.service';
import { LangSwitcherComponent } from '../../../shared/components/lang-switcher.component';

/**
 * Password reset — step 2: user arrives via /reset?token=xxx and types
 * a new password. On success, redirects to /login.
 */
@Component({
  selector: 'kipa-reset',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule, LangSwitcherComponent, TranslocoModule],
  templateUrl: './reset.component.html',
  styleUrl: '../recover/recover.component.scss',
})
export class ResetComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly transloco = inject(TranslocoService);

  readonly Lock = Lock;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly ArrowLeft = ArrowLeft;
  readonly ArrowRight = ArrowRight;
  readonly CheckCircle = CheckCircle2;

  readonly token = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly showConfirm = signal(false);
  readonly submitting = signal(false);
  readonly success = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group(
    {
      new_password: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', [Validators.required]],
    },
    { validators: [matchValidator] },
  );

  ngOnInit(): void {
    const t = this.route.snapshot.queryParamMap.get('token');
    if (!t) {
      this.errorMessage.set(this.transloco.translate('reset.error.missingToken'));
      return;
    }
    this.token.set(t);
  }

  togglePassword(): void { this.showPassword.update((v) => !v); }
  toggleConfirm(): void  { this.showConfirm.update((v) => !v); }

  fieldHasError(name: 'new_password' | 'confirm'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.dirty || c.touched);
  }

  hasMismatch(): boolean {
    return this.form.errors?.['mismatch'] && this.form.controls.confirm.dirty;
  }

  submit(): void {
    this.errorMessage.set(null);
    if (this.form.invalid || !this.token()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.auth.resetPassword({ token: this.token()!, new_password: this.form.controls.new_password.value }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        if (err instanceof HttpErrorResponse) {
          if (err.status === 400 || err.status === 401 || err.status === 404) {
            this.errorMessage.set(this.transloco.translate('reset.error.invalidToken'));
          } else if (err.status >= 500) {
            this.errorMessage.set(this.transloco.translate('login.error.serverDown'));
          } else if (err.status === 0) {
            this.errorMessage.set(this.transloco.translate('login.error.noConnection'));
          } else {
            this.errorMessage.set(this.transloco.translate('login.error.generic'));
          }
        } else {
          this.errorMessage.set(this.transloco.translate('login.error.generic'));
        }
      },
    });
  }
}

function matchValidator(group: AbstractControl): ValidationErrors | null {
  const a = group.get('new_password')?.value;
  const b = group.get('confirm')?.value;
  return a === b ? null : { mismatch: true };
}
